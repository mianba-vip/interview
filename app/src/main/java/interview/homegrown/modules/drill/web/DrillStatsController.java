package interview.homegrown.modules.drill.web;

import interview.homegrown.common.web.CurrentUser;
import interview.homegrown.modules.drill.service.HistoryService;
import interview.homegrown.modules.drill.service.NoteService;
import interview.homegrown.modules.drill.service.ProfileService;
import interview.homegrown.modules.drill.service.RecordCleanupService;
import interview.homegrown.modules.drill.web.dto.*;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 看数与档案：深度画像、内化欠账、历史列表/详情/清理、run 详情。
 * 从 DrillController 拆出（P1 结构重构），路径与行为完全不变。
 */
@RestController
@RequestMapping("/api/drill")
public class DrillStatsController {

    private final NoteService noteService;
    private final ProfileService profileService;
    private final HistoryService historyService;
    private final RecordCleanupService recordCleanupService;

    public DrillStatsController(NoteService noteService, ProfileService profileService,
                                HistoryService historyService, RecordCleanupService recordCleanupService) {
        this.noteService = noteService;
        this.profileService = profileService;
        this.historyService = historyService;
        this.recordCleanupService = recordCleanupService;
    }

    @GetMapping("/debt")
    public List<DebtView> debt() {
        return noteService.debt(CurrentUser.id());
    }

    // ------------------------------------------------------------- 看数

    @GetMapping("/profile")
    public List<ProfileService.TopicProfile> profile() {
        Long uid = CurrentUser.id();
        return profileService.profile(uid);
    }

    /** 能力画像 md 文档（已训练能力清单），供用户画像页展示 + 注入下次出题 */
    @GetMapping("/profile/skill-doc")
    public Map<String, String> skillDoc() {
        Long uid = CurrentUser.id();
        return Map.of("markdown", profileService.skillDoc(uid));
    }

    // -------------------------------------------------------- 问答记录

    @GetMapping("/history")
    public List<RunSummaryView> history() {
        return historyService.list(CurrentUser.id());
    }

    /** 对话线：一道题（questionId）的完整问答历史，前端点卡片后渲染 */
    @GetMapping("/history/conversation/{questionId}")
    public ConversationView conversation(@PathVariable Long questionId) {
        return historyService.conversation(CurrentUser.id(), questionId);
    }

    /**
     * 删除一道题的整条问答记录（级联：追问场 / 判分 / 复盘 / 笔记）。
     * 只删记录，不动掌握度与题库。删除前由前端二次确认。
     */
    @DeleteMapping("/history/conversation/{questionId}")
    public Map<String, Object> deleteConversation(@PathVariable Long questionId) {
        Long uid = CurrentUser.id();
        int deleted = recordCleanupService.deleteConversation(uid, questionId);
        return Map.of("ok", true, "deleted", deleted);
    }

    /**
     * 删除单条作答记录及其全部关联数据（追问场 / 判分 / 复盘 / 笔记）。
     * 供「内化复盘」页删除欠账 / 复盘数据。删除前由前端二次确认。
     */
    @DeleteMapping("/runs/{runId}")
    public Map<String, Object> deleteRun(@PathVariable Long runId) {
        Long uid = CurrentUser.id();
        int deleted = recordCleanupService.deleteRun(uid, runId);
        return Map.of("ok", true, "deleted", deleted);
    }

    @GetMapping("/{runId}")
    public RunDetailView historyDetail(@PathVariable Long runId) {
        return historyService.detail(CurrentUser.id(), runId);
    }
}
