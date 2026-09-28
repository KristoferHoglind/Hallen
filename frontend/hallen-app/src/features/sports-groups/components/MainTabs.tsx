import { Button } from "react-bootstrap";

export type MainTab = "play" | "groups";

type MainTabsProps = {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
};

export function MainTabs({ activeTab, onChangeTab }: MainTabsProps) {
  return (
    <div className="d-flex gap-2 mb-3">
      <Button
        variant={activeTab === "play" ? "primary" : "outline-primary"}
        className="flex-fill"
        onClick={() => onChangeTab("play")}
      >
        Spela
      </Button>

      <Button
        variant={activeTab === "groups" ? "primary" : "outline-primary"}
        className="flex-fill"
        onClick={() => onChangeTab("groups")}
      >
        Grupp
      </Button>
    </div>
  );
}