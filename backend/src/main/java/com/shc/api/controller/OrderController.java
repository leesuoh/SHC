package com.shc.api.controller;

import com.shc.api.dto.ApiResponse;
import com.shc.api.dto.OrderRequest;
import com.shc.api.dto.OrderResponse;
import com.shc.api.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /** GET /api/orders/today — 오늘의 정비 목록 */
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getToday(Authentication auth) {
        Integer mechanicId = (Integer) auth.getPrincipal();
        String  role       = extractRole(auth);
        return ResponseEntity.ok(ApiResponse.ok(orderService.getTodayOrders(mechanicId, role)));
    }

    /** GET /api/orders/{id} — 주문 단건 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrder(id)));
    }

    /** POST /api/orders — 신규 주문 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> create(
            @Valid @RequestBody OrderRequest req, Authentication auth) {
        Integer mechanicId = (Integer) auth.getPrincipal();
        OrderResponse response = orderService.createOrder(req, mechanicId);
        return ResponseEntity.status(201).body(ApiResponse.ok(response));
    }

    /** PATCH /api/orders/{id}/status — 상태 변경 */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        Integer mechanicId = (Integer) auth.getPrincipal();
        String  role       = extractRole(auth);
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.updateStatus(id, body.get("status"), mechanicId, role)));
    }

    /** GET /api/orders/vehicle/{plateNumber} — 차량 이력 */
    @GetMapping("/vehicle/{plateNumber}")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getVehicleHistory(
            @PathVariable String plateNumber) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getVehicleHistory(plateNumber)));
    }

    private String extractRole(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.replace("ROLE_", "").toLowerCase())
                .findFirst().orElse("mechanic");
    }
}
