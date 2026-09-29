import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getStoredUserId, getToken } from '../api/client';
import { DATA_CHANGED, SESSION_CHANGED } from '../api/dataEvents';
import { drill, studyPlan } from '../api/drill';
import { interviewApi, resumeApi, type InterviewListItem, type ResumeDetail, type ResumeListItem } from '../api/interview';
import { knowledgeApi } from '../api/knowledge';
import type { DailyTaskView, DebtView, KnowledgeCard, PlanView } from '../api/types';
import { KeyedResourceCache, ResourceCache } from './resourceCache';

interface DashboardData {
  plans: PlanView[];
  today: DailyTaskView[];
  cards: KnowledgeCard[];
  due: KnowledgeCard[];
  interviews: InterviewListItem[];
  debt: DebtView[];
  resumes: ResumeListItem[];
}
type Section = keyof DashboardData;
const ALL_SECTIONS: readonly Section[] = ['plans', 'today', 'cards', 'due', 'interviews', 'debt'];
export const TODAY_ONLY: readonly Section[] = ['today'];
export const PLANS_ONLY: readonly Section[] = ['plans'];
export const RESUMES_ONLY: readonly Section[] = ['resumes'];
export const DASHBOARD_LABELS: Record<Section, string> = {
  plans: '学习计划',
  today: '今日任务',
  cards: '知识卡片',
  due: '卡片复习',
  interviews: '面试记录',
  debt: '内化复盘',
  resumes: '简历管理',
};

let current: {
  identity: string;
  cache: ResourceCache<DashboardData>;
  resumeDetails: KeyedResourceCache<number, ResumeDetail>;
} | null = null;

function clearCache() {
  const previous = current;
  current = null;
  previous?.cache.dispose();
  previous?.resumeDetails.clear();
}

window.addEventListener(SESSION_CHANGED, clearCache);
// 同浏览器其他窗口退出/切换账号，也不能保留旧用户的首页数据。
window.addEventListener('storage', (event) => {
  if (event.key === null || event.key.startsWith('yan.token:') || event.key.startsWith('yan.userId:')) {
    clearCache();
  }
});

function getSession(userId: string | null) {
  // token 按 API 地址隔离，且仅用作内存身份比较，不写入额外存储。
  const identity = JSON.stringify([userId, getStoredUserId(), getToken()]);
  if (!current || current.identity !== identity) {
    clearCache();
    current = {
      identity,
      cache: new ResourceCache<DashboardData>({
        plans: studyPlan.list,
        today: drill.today,
        cards: knowledgeApi.list,
        due: knowledgeApi.due,
        interviews: interviewApi.list,
        debt: drill.debt,
        resumes: resumeApi.list,
      }),
      resumeDetails: new KeyedResourceCache(resumeApi.detail),
    };
  }
  return current;
}

function affectedSections(path: string): readonly Section[] {
  if (/^\/drill\/\d+\/card$/.test(path)) return ['cards', 'due'];
  if (/^\/knowledge\/(?:cards|capture)(?:\/|$|\?)/.test(path)) return ['cards', 'due', 'plans'];
  if (/^\/(?:drill|study-plan)(?:\/|$)/.test(path)) return ['plans', 'today', 'debt'];
  if (/^\/interviews(?:\/|$)/.test(path)) return ['interviews'];
  if (/^\/resumes(?:\/|$)/.test(path)) return ['resumes'];
  return [];
}

window.addEventListener(DATA_CHANGED, (event) => {
  const path = (event as CustomEvent<string>).detail;
  if (/^\/resumes(?:\/|$)/.test(path)) current?.resumeDetails.clear();
  current?.cache.invalidate(affectedSections(path));
});

/** 简历详情按 ID 去重和短时缓存；上传/删除及账号切换时与列表一起失效。 */
export function getCachedResumeDetail(userId: string | null, id: number): Promise<ResumeDetail> {
  return getSession(userId).resumeDetails.get(id);
}

/** 上传接口已返回完整详情，无需为了展示它再发一次 GET。 */
export function rememberResumeDetail(userId: string | null, detail: ResumeDetail): void {
  getSession(userId).resumeDetails.set(detail.id, detail);
}

/** 供仍以命令式方式加载的练习/记录页面复用首页计划缓存。 */
export function getCachedStudyPlans(): Promise<PlanView[]> {
  return getSession(getStoredUserId()).cache.getValue('plans');
}

export function useDashboardData(userId: string | null, sections: readonly Section[] = ALL_SECTIONS) {
  const cache = getSession(userId).cache;
  const snapshot = useSyncExternalStore(cache.subscribe, cache.getSnapshot);

  useEffect(() => {
    if (!userId) return;
    return cache.watch(sections);
  }, [cache, sections, userId]);

  useEffect(() => {
    if (!userId) return;
    // 返回窗口、跨日及长时间停留时静默校验新鲜度；隐藏网页不轮询六组统计。
    const revalidate = () => {
      if (document.visibilityState === 'visible') cache.refreshWatched();
    };
    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    const timer = window.setInterval(revalidate, 60_000);
    return () => {
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
      window.clearInterval(timer);
    };
  }, [cache, userId]);

  const refresh = useCallback(() => cache.refresh(sections, true), [cache, sections]);
  // 各页面只看自己订阅的失败项，简历接口失败不应让首页显示无关告警。
  const failed = snapshot.failed.filter((section) => sections.includes(section));
  return { ...snapshot, failed, refresh };
}
