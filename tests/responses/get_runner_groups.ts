export const makeResponse = (group_name: string) => ({
  data: {
    total_count: 2,
    runner_groups: [
      {
        id: 1,
        name: "Default",
        visibility: "all",
        allows_public_repositories: true,
        default: true,
        workflow_restrictions_read_only: false,
        restricted_to_workflows: false,
        selected_workflows: [],
        runners_url:
          "https://api.github.com/orgs/rapidsai/actions/runner-groups/1/runners",
        inherited: false,
      },
      {
        id: 6,
        name: group_name,
        visibility: "all",
        allows_public_repositories: true,
        default: false,
        workflow_restrictions_read_only: false,
        restricted_to_workflows: false,
        selected_workflows: [],
        runners_url:
          "https://api.github.com/orgs/rapidsai/actions/runner-groups/6/runners",
        inherited: false,
      },
    ],
  },
});
