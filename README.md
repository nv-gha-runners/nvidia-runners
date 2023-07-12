# rapids-runners

This repository is the TypeScript-application backend for the `rapids-runners` GitHub application.

When the GitHub application is installed, the `rapids-runners` group is automatically created in the organization.

The default settings for the `rapids-runners` runner group are:

- Enable runners on public repositories
- Allow runners to be used on selected repositories (though no repositories are selected by default)

After installation, organization administrators can further configure the runner group to select which repositories should be able to use the runners (or enable the runners on all repositories).

The `rapids-runners` GitHub application is installable by the public, but uses the [webhook-authorizer](https://github.com/nv-gha-runners/webhook-authorizer) library to uninstall itself from organizations that aren't explicitly added to the allow-list (see [lambda.ts](./src/lambda.ts) for the allow-list).
