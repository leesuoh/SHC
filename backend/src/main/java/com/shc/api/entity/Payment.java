package com.shc.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "payments")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false, length = 10)
    private PaymentType paymentType;

    @Column(nullable = false)
    private Integer amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING;

    // ── Dual-Lock 추적 ──
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by")
    private Mechanic requestedBy;   // 결제 신청 직원

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Mechanic approvedBy;    // 승인한 사장님

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by")
    private Mechanic rejectedBy;    // 반려한 사장님

    private Instant requestedAt;
    private Instant approvedAt;
    private Instant rejectedAt;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    // ── Enums ──
    public enum PaymentType {
        CASH, CARD, TRANSFER, CREDIT
    }

    public enum Status {
        PENDING,    // 승인 대기 (현금) 또는 초기 상태
        CONFIRMED,  // 결제 확정
        REJECTED    // 반려 (현금 only)
    }

    // ── 편의 메서드 ──

    /** 카드/이체/미수 — 즉시 확정 */
    public static Payment instant(Order order, PaymentType type, Integer amount, Mechanic requester) {
        return Payment.builder()
                .order(order)
                .paymentType(type)
                .amount(amount)
                .status(Status.CONFIRMED)
                .requestedBy(requester)
                .requestedAt(Instant.now())
                .approvedAt(Instant.now())
                .build();
    }

    /** 현금 — 승인 대기 상태로 생성 */
    public static Payment cashPending(Order order, Integer amount, Mechanic requester) {
        return Payment.builder()
                .order(order)
                .paymentType(PaymentType.CASH)
                .amount(amount)
                .status(Status.PENDING)
                .requestedBy(requester)
                .requestedAt(Instant.now())
                .build();
    }

    /** 현금 승인 */
    public void approve(Mechanic admin) {
        this.status = Status.CONFIRMED;
        this.approvedBy = admin;
        this.approvedAt = Instant.now();
    }

    /** 현금 반려 */
    public void reject(Mechanic admin, String reason) {
        this.status = Status.REJECTED;
        this.rejectedBy = admin;
        this.rejectedAt = Instant.now();
        this.rejectReason = reason;
    }
}
