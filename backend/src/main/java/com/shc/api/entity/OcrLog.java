package com.shc.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ocr_logs")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OcrLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "ocr_type", nullable = false, length = 20)
    private OcrType ocrType;

    @Column(name = "raw_result", columnDefinition = "TEXT")
    private String rawResult;       // OCR 원본 텍스트

    @Column(name = "parsed_value", length = 200)
    private String parsedValue;     // 파싱된 최종값

    @Column(precision = 5, scale = 4)
    private BigDecimal confidence;  // 0.0000 ~ 1.0000

    @Column(name = "image_path", length = 500)
    private String imagePath;       // S3 or 로컬 경로

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    // ── Enum ──
    public enum OcrType {
        PLATE,          // 번호판 → 차량 번호
        VIN_STICKER,    // VIN 스티커 → 차종/연식/차대번호
        ODOMETER        // 계기판 → 주행거리
    }
}
