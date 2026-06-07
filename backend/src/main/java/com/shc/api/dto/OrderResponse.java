package com.shc.api.dto;

import com.shc.api.entity.Order;
import com.shc.api.entity.OrderItem;
import com.shc.api.entity.Payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String plateNumber,
        String model,
        Integer year,
        String vin,
        String fuelType,
        Integer mileage,
        String status,
        String notes,
        MechanicDto mechanic,
        List<ItemDto> items,
        PaymentDto payment,
        int totalPrice,
        Instant createdAt
) {
    public record MechanicDto(Integer id, String name, String role, String grade) {}

    public record ItemDto(
            Long id, String itemType, String name,
            int quantity, int unitPrice, int totalPrice,
            String oilBrand, BigDecimal oilLiters, int sortOrder
    ) {}

    public record PaymentDto(
            Long id, String paymentType, String status, int amount,
            String requestedBy, String approvedBy, Instant requestedAt, Instant approvedAt
    ) {}

    // ── Entity → DTO 변환 ──
    public static OrderResponse from(Order order) {
        var vehicle = order.getVehicle();
        var mechanic = order.getMechanic();

        List<ItemDto> items = order.getItems().stream()
                .sorted((a, b) -> Short.compare(a.getSortOrder(), b.getSortOrder()))
                .map(i -> new ItemDto(
                        i.getId(), i.getItemType().name(), i.getName(),
                        i.getQuantity(), i.getUnitPrice(), i.getTotalPrice(),
                        i.getOilBrand(), i.getOilLiters(), i.getSortOrder()
                )).toList();

        PaymentDto paymentDto = order.getPayments().stream()
                .filter(p -> p.getStatus() != Payment.Status.REJECTED)
                .findFirst()
                .map(p -> new PaymentDto(
                        p.getId(), p.getPaymentType().name(), p.getStatus().name(), p.getAmount(),
                        p.getRequestedBy() != null ? p.getRequestedBy().getName() : null,
                        p.getApprovedBy()  != null ? p.getApprovedBy().getName()  : null,
                        p.getRequestedAt(), p.getApprovedAt()
                )).orElse(null);

        return new OrderResponse(
                order.getId(),
                vehicle.getPlateNumber(), vehicle.getModel(), vehicle.getYear() != null ? vehicle.getYear().intValue() : null,
                vehicle.getVin(), vehicle.getFuelType() != null ? vehicle.getFuelType().name() : null,
                order.getMileage(), order.getStatus().name(), order.getNotes(),
                new MechanicDto(mechanic.getId(), mechanic.getName(), mechanic.getRole().name(), mechanic.getGrade().name()),
                items, paymentDto, order.getTotalPrice(), order.getCreatedAt()
        );
    }
}
