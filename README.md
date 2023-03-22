# rapids-runners

This repository is the TypeScript-application backend for the `rapids-runners` GitHub application.

The TypeScript application performs some actions when the GitHub application is installed/uninstalled from an organization:

| Event                             | Action                                                          |
| --------------------------------- | --------------------------------------------------------------- |
| GitHub Application Installation   | Creates the `rapids-runners` runner group in the organization   |
| GitHub Application Uninstallation | Deletes the `rapids-runners` runner group from the organization |

When the `rapids-runners` runner group is created, it is configured to:

- Enable runners on public repositories
- Allow runners to be used on selected repositories (though no repositories are selected by default)

After installation, organization administrators can further configure the runner group to select which repositories should be able to use the runners (or enable the runners on all repositories).

The `rapids-runners` GitHub application is installable by the public, but uses the [webhook-authorizer](https://github.com/rapidsai/webhook-authorizer) library to uninstall itself from organizations that aren't explicitly added to the allow-list (see [lambda.ts](./src/lambda.ts) for the allow-list).
