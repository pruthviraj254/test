import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerZIP } from '@electron-forge/maker-zip';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const updatePublishUrl =
  process.env.UPDATE_PUBLISH_URL ??
  process.env.NEXT_PUBLIC_UPDATE_SERVER_URL ??
  'https://our-admin-api.com/update/feed';

const [githubOwner = 'your-org', githubRepo = 'betauser-test'] =
  process.env.GITHUB_REPOSITORY?.split('/') ?? [];

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: ['./src/renderer/out'],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@felixrieseberg/electron-forge-maker-nsis',
      platforms: ['win32'],
      config: {
        updater: {
          provider: 'generic',
          url: updatePublishUrl,
          channel: process.env.UPDATE_CHANNEL ?? 'stable',
        },
      },
    },
    new MakerZIP({}, ['darwin']),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: githubOwner,
        name: githubRepo,
      },
      draft: false,
      prerelease: false,
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer-stub.ts',
            name: 'main_window',
            preload: {
              js: './src/main/preload.ts',
            },
          },
        ],
      },
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
