package interview.homegrown.modules.studyplan.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * 一次知识图谱锻造。提案本体保存在 kg-forge sidecar 的 LangGraph checkpoint
 * （thread_id 关联）；批准时才由本服务校验去重后写入 concept 表——
 * Agent 只有提案权，写库权在后端。
 */
@Entity
@Table(name = "kg_forge_run")
@Getter
@Setter
public class KgForgeRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    /** 锻造进哪个学习方向；空 = 全局概念池（study_plan_id 为空的种子概念）。 */
    private Long planId;

    @Column(nullable = false)
    private String topic;

    private String goal;

    @Column(name = "layer_budget", nullable = false)
    private int layerBudget = 50;

    /** = kg-forge 的 LangGraph thread_id（"forge-" + id）。 */
    @Column(name = "thread_id", nullable = false)
    private String threadId;

    /** PENDING / RUNNING / AWAITING_REVIEW / APPROVED / REJECTED / FAILED。 */
    @Column(nullable = false)
    private String status = "PENDING";

    private String error;

    @Column(name = "concept_count", nullable = false)
    private int conceptCount = 0;

    @Column(insertable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(insertable = false)
    private Instant updatedAt;
}
