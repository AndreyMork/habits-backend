import Docker from 'dockerode';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as F from 'fp-ts/function';
import * as Record from 'fp-ts/ReadonlyRecord';
import * as Arr from 'fp-ts/ReadonlyArray';

import { tryCatch } from '../utils';
import type { TaskEitherError } from '../types';

export class TestContainer {
  readonly #container: Docker.Container;

  protected constructor(container: Docker.Container) {
    this.#container = container;
  }

  static run({
    image,
    env,
  }: {
    image: string;
    env: Record<string, string>;
  }): TaskEitherError<TestContainer> {
    const docker = new Docker();

    const envArray = Object.entries(env).map(
      ([key, value]) => `${key}=${value}`
    );

    const containerOptions = {
      Image: image,
      Env: envArray,
      HostConfig: {
        PublishAllPorts: true,
        AutoRemove: true,
      },
    };

    const result: TaskEitherError<TestContainer> = F.pipe(
      tryCatch(async () => docker.createContainer(containerOptions)),
      TE.map((container) => new TestContainer(container)),
      TE.chain((container) => container.start())
    );

    return result;
  }

  start(): TaskEitherError<TestContainer> {
    return F.pipe(
      tryCatch(async () => this.#container.start()),
      TE.map(F.constant(this))
    );
  }

  stop(): TaskEitherError<TestContainer> {
    return F.pipe(
      tryCatch(async () => this.#container.stop()),
      TE.map(F.constant(this))
    );
  }

  info(): TaskEitherError<Docker.ContainerInspectInfo> {
    return tryCatch(async () => this.#container.inspect());
  }

  getPortAndHost(
    exposedPort: string
  ): TaskEitherError<{ ip: string; port: string }> {
    return F.pipe(
      this.info(),
      TE.map((info) => info.NetworkSettings.Ports),
      TE.chain(
        F.flow(
          Record.lookup(exposedPort),
          O.chain(Arr.head),
          O.map(({ HostIp, HostPort }) => ({ ip: HostIp, port: HostPort })),
          TE.fromOption(
            () => new Error('Container is not bound to provided port')
          )
        )
      )
    );
  }
}
