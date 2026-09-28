import LoginScreen from "@/screens/LoginScreen";
import HomeScreen from "@/screens/HomeScreen";
import PracticeScreen from "@/screens/PracticeScreen";
import RunScreen from "@/screens/RunScreen";
import ReviewScreen from "@/screens/ReviewScreen";
import LessonScreen from "@/screens/LessonScreen";
import InterviewScreen from "@/screens/InterviewScreen";
import InterviewSessionScreen from "@/screens/InterviewSessionScreen";
import SedimentScreen from "@/screens/SedimentScreen";
import MeScreen from "@/screens/MeScreen";
import SettingsScreen from "@/screens/SettingsScreen";

export const routes = [
  {
    path: "/login",
    component: LoginScreen,
    guid: "2:341",
  },
  {
    path: "/tasks",
    component: HomeScreen,
    guid: "2:394",
  },
  {
    path: "/practice",
    component: PracticeScreen,
    guid: "2:579",
  },
  {
    path: "/run/:runId",
    component: RunScreen,
    guid: "2:720",
  },
  {
    path: "/review/:runId",
    component: ReviewScreen,
    guid: "2:877",
  },
  {
    path: "/lesson",
    component: LessonScreen,
    guid: "2:965",
  },
  {
    path: "/interview",
    component: InterviewScreen,
    guid: "2:1051",
  },
  {
    path: "/interview/session",
    component: InterviewSessionScreen,
    guid: "2:1180",
  },
  {
    path: "/sediment",
    component: SedimentScreen,
    guid: "2:1242",
  },
  {
    path: "/me",
    component: MeScreen,
    guid: "2:1403",
  },
  {
    path: "/settings",
    component: SettingsScreen,
    guid: "2:1579",
  },
];

export const guidPathMap = new Map(routes.map((item) => [item.guid, item.path]));
export const pathGuidMap = new Map(routes.map((item) => [item.path, item.guid]));

export const getPathByGuid = (guid: string) => {
  return guidPathMap.get(guid) || "";
};

export const getGuidByPath = (path: string) => {
  return pathGuidMap.get(path) || "";
};
