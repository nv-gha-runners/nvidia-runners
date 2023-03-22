import { makeLambdaEvent } from "../lambda_event";

type ArgType = {
  action: "deleted" | "created" | "updated";
  orgName?: string;
};

const GH_EVENT_NAME = "installation";

export const makeInstallationEvent = ({ action, orgName }: ArgType) => {
  return makeLambdaEvent(GH_EVENT_NAME, {
    action,
    installation: {
      id: 33174052,
      account: {
        login: orgName || "rapidsai",
        id: 45887043,
        node_id: "MDQ6VXNlcjQ1ODg3MDQz",
        avatar_url: "https://avatars.githubusercontent.com/u/45887043?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/probottest",
        html_url: "https://github.com/probottest",
        followers_url: "https://api.github.com/users/probottest/followers",
        following_url:
          "https://api.github.com/users/probottest/following{/other_user}",
        gists_url: "https://api.github.com/users/probottest/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/probottest/starred{/owner}{/repo}",
        subscriptions_url:
          "https://api.github.com/users/probottest/subscriptions",
        organizations_url: "https://api.github.com/users/probottest/orgs",
        repos_url: "https://api.github.com/users/probottest/repos",
        events_url: "https://api.github.com/users/probottest/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/probottest/received_events",
        type: "User",
        site_admin: false,
      },
      repository_selection: "all",
      access_tokens_url:
        "https://api.github.com/app/installations/33174052/access_tokens",
      repositories_url: "https://api.github.com/installation/repositories",
      html_url: "https://github.com/settings/installations/33174052",
      app_id: 281868,
      app_slug: "rapids-ops-test",
      target_id: 45887043,
      target_type: "User",
      permissions: {
        issues: "write",
        metadata: "read",
      },
      events: ["issue_comment"],
      created_at: "2023-01-16T00:07:12.000Z",
      updated_at: "2023-01-16T00:07:13.000Z",
      single_file_name: null,
      has_multiple_single_files: false,
      single_file_paths: [],
      suspended_by: null,
      suspended_at: null,
    },
    repositories: [
      {
        id: 589345151,
        node_id: "R_kgDOIyCxfw",
        name: "test_repo",
        full_name: "probottest/test_repo",
        private: true,
      },
    ],
    sender: {
      login: "probottest",
      id: 45887043,
      node_id: "MDQ6VXNlcjQ1ODg3MDQz",
      avatar_url: "https://avatars.githubusercontent.com/u/45887043?v=4",
      gravatar_id: "",
      url: "https://api.github.com/users/probottest",
      html_url: "https://github.com/probottest",
      followers_url: "https://api.github.com/users/probottest/followers",
      following_url:
        "https://api.github.com/users/probottest/following{/other_user}",
      gists_url: "https://api.github.com/users/probottest/gists{/gist_id}",
      starred_url:
        "https://api.github.com/users/probottest/starred{/owner}{/repo}",
      subscriptions_url:
        "https://api.github.com/users/probottest/subscriptions",
      organizations_url: "https://api.github.com/users/probottest/orgs",
      repos_url: "https://api.github.com/users/probottest/repos",
      events_url: "https://api.github.com/users/probottest/events{/privacy}",
      received_events_url:
        "https://api.github.com/users/probottest/received_events",
      type: "User",
      site_admin: false,
    },
  });
};
