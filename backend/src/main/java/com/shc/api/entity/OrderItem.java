package com.shc.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    @Builder.Default
    private ItemType itemType = ItemType.CUSTOM;

    @Column(nullable = false, length = 200)
    private String name;          // "Hyundai Xteer Top 5W-30 4L"

    @Column(nullable = false)
    @Builder.Default
    private Short quantity = 1;

    @Column(name = "unit_price", nullable = false)
    private Integer unitPrice;    // 원 단위

    @Column(name = "total_price", nullable = false)
    private Integer totalPrice;   // unitPrice * quantity

    // 엔진오일 전용 (nullable)
    @Column(name = "oil_brand", length = 50)
    private String oilBrand;      // "TOP", "MN", "PAO", "Q4", "Q1", "XT"

    @Column(name = "oil_liters", precision = 4, scale = 1)
    private BigDecimal oilLiters; // 4.0, 7.0

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Short sortOrder = 0;

    // ── Enum ──
    public enum ItemType {
        ENGINE_OIL,
        PRESET,
        CUSTOM
    }

    // ── 편의 메서드 ──
    @PrePersist
    @PreUpdate
    public void calculateTotal() {
        if (unitPrice != null && quantity != null) {
            this.totalPrice = unitPrice * quantity;
        }
    }
}
