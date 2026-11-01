import { GroupSessionResults } from "./GroupSessionResults";
import { useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { GroupDescription, GroupStatistics } from "./GroupOverview";
import { PlayersPanel } from "../../players/components/PlayersPanel";
import { SportsGroupMembersPanel } from "../../sports-group-members/components/SportsGroupMembersPanel";
import type { SportsGroup } from "../types/sportsGroup";

export function GroupContents({
  currentUserId,
  group,
  initialTab,
  onGroupPermissionsChanged,
}: {
  currentUserId: string;
  group: SportsGroup;
  initialTab: "players" | "members" | "results" | "statistics";
  onGroupPermissionsChanged: (groupId: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<string>(initialTab);
  return (
    <>
      <GroupDescription sportsGroupId={group.id} canManage={group.canManage} />
      <Tabs
        id={`group-contents-${group.id}`}
        activeKey={tab}
        onSelect={(key) => {
          if (key) setTab(key);
        }}
        className="mb-3"
        mountOnEnter
      >
        <Tab eventKey="players" title="Spelare">
          <PlayersPanel sportsGroupId={group.id} canManage={group.canManage} />
        </Tab>
        <Tab eventKey="members" title="Medlemmar och behörigheter">
          <SportsGroupMembersPanel
            currentUserId={currentUserId}
            sportsGroupId={group.id}
            canManage={group.canManage}
            isOwner={group.isOwner}
            onPermissionsChanged={() => onGroupPermissionsChanged(group.id)}
          />
        </Tab>

        <Tab eventKey="statistics" title="Gruppstatistik">
          {tab === "statistics" && <GroupStatistics sportsGroupId={group.id} />}
        </Tab>
        <Tab eventKey="results" title="Sessionsstatistik">
          {tab === "results" && (
            <GroupSessionResults sportsGroupId={group.id} />
          )}
        </Tab>
      </Tabs>
    </>
  );
}
