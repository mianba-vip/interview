import Frame2579 from "@/views/Frame2579";
import Frame21242 from "@/views/Frame21242";
import Frame2720 from "@/views/Frame2720";
import Frame2394 from "@/views/Frame2394";
import Frame2807 from "@/views/Frame2807";
import Frame21180 from "@/views/Frame21180";
import Frame21051 from "@/views/Frame21051";
import Frame2965 from "@/views/Frame2965";
import Frame2341 from "@/views/Frame2341";
import Frame2877 from "@/views/Frame2877";
import Frame249 from "@/views/Frame249";
import Frame21403 from "@/views/Frame21403";
import Frame21579 from "@/views/Frame21579";

export const routes = [{
          path: "/frame2579",
          component: Frame2579,
          guid: "2:579",
        },
{
          path: "/frame21242",
          component: Frame21242,
          guid: "2:1242",
        },
{
          path: "/frame2720",
          component: Frame2720,
          guid: "2:720",
        },
{
          path: "/frame2394",
          component: Frame2394,
          guid: "2:394",
        },
{
          path: "/frame2807",
          component: Frame2807,
          guid: "2:807",
        },
{
          path: "/frame21180",
          component: Frame21180,
          guid: "2:1180",
        },
{
          path: "/frame21051",
          component: Frame21051,
          guid: "2:1051",
        },
{
          path: "/frame2965",
          component: Frame2965,
          guid: "2:965",
        },
{
          path: "/frame2341",
          component: Frame2341,
          guid: "2:341",
        },
{
          path: "/frame2877",
          component: Frame2877,
          guid: "2:877",
        },
{
          path: "/",
          component: Frame249,
          guid: "2:49",
        },
{
          path: "/frame21403",
          component: Frame21403,
          guid: "2:1403",
        },
{
          path: "/frame21579",
          component: Frame21579,
          guid: "2:1579",
        }];


export const guidPathMap = new Map(
  routes.map((item) => [item.guid, item.path])
);
export const pathGuidMap = new Map(
  routes.map((item) => [item.path, item.guid])
);

export const getPathByGuid = (guid: string) => {
  return guidPathMap.get(guid) || "";
};

export const getGuidByPath = (path: string) => {
  return pathGuidMap.get(path) || "";
};
