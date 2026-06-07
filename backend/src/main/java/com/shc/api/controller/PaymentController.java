package com.shc.api.controller;

import com.shc.api.dto.ApiResponse;
import com.shc.api.dto.PaymentRequest;
import com.shc.api.entity.Payment;
import com.shc.api.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /** POST /api/payments — 결제 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<Long>> create(
            @Valid @RequestBody PaymentRequest req, Authentication auth) {
        Integer mechanicId = (Integer) auth.getPrincipal();
        Payment payment = paymentService.createPayment(req, mechanicId);
        return ResponseEntity.status(201).body(ApiResponse.ok(payment.getId()));
    }

    /** POST /api/payments/{id}/approve — 현금 승인 (admin) */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<String>> approve(
            @PathVariable Long id, Authentication auth) {
        Integer adminId = (Integer) auth.getPrincipal();
        paymentService.approveCash(id, adminId);
        return ResponseEntity.ok(ApiResponse.ok("승인 완료"));
    }

    /** POST /api/payments/{id}/reject — 현금 반려 (admin) */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<String>> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        Integer adminId = (Integer) auth.getPrincipal();
        paymentService.rejectCash(id, body.getOrDefault("reason", ""), adminId);
        return ResponseEntity.ok(ApiResponse.ok("반려 처리됨"));
    }

    /** GET /api/payments/pending — 승인 대기 ID 목록 (admin) */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<Long>>> getPending(Authentication auth) {
        Integer adminId = (Integer) auth.getPrincipal();
        var list = paymentService.getPendingCashPayments(adminId)
                .stream().map(Payment::getId).toList();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /** GET /api/payments/pending/full — 승인 대기 상세 목록 (admin, UI용) */
    @GetMapping("/pending/full")
    public ResponseEntity<ApiResponse<List<PaymentSummary>>> getPendingFull(Authentication auth) {
        Integer adminId = (Integer) auth.getPrincipal();
        var list = paymentService.getPendingCashPayments(adminId).stream()
                .map(p -> new PaymentSummary(
                        p.getId(), p.getAmount(),
                        p.getRequestedAt(),
                        p.getRequestedBy() != null ? p.getRequestedBy().getName() : null,
                        p.getOrder() != null ? p.getOrder().getId() : null,
                        p.getOrder() != null && p.getOrder().getVehicle() != null
                                ? p.getOrder().getVehicle().getPlateNumber() : null,
                        p.getOrder() != null && p.getOrder().getVehicle() != null
                                ? p.getOrder().getVehicle().getModel() : null
                )).toList();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    record PaymentSummary(Long id, Integer amount, java.time.Instant requestedAt,
                          String requestedBy, Long orderId,
                          String plateNumber, String model) {}
}
