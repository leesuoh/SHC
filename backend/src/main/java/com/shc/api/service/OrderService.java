package com.shc.api.service;

import com.shc.api.dto.OrderRequest;
import com.shc.api.dto.OrderResponse;
import com.shc.api.entity.*;
import com.shc.api.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository    orderRepository;
    private final VehicleRepository  vehicleRepository;
    private final MechanicRepository mechanicRepository;

    /** 오늘의 정비 목록 */
    @Transactional(readOnly = true)
    public List<OrderResponse> getTodayOrders(Integer mechanicId, String role) {
        Instant startOfDay = LocalDate.now(ZoneId.of("Asia/Seoul"))
                .atStartOfDay(ZoneId.of("Asia/Seoul")).toInstant();

        List<Order> orders = role.equals("admin")
                ? orderRepository.findTodayOrders(startOfDay)
                : orderRepository.findTodayOrdersByMechanic(startOfDay, mechanicId);

        return orders.stream().map(OrderResponse::from).toList();
    }

    /** 주문 단건 조회 */
    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("주문을 찾을 수 없습니다: " + orderId));
        return OrderResponse.from(order);
    }

    /** 신규 주문 생성 */
    @Transactional
    public OrderResponse createOrder(OrderRequest req, Integer mechanicId) {
        Mechanic mechanic = mechanicRepository.findById(mechanicId)
                .orElseThrow(() -> new EntityNotFoundException("직원을 찾을 수 없습니다"));

        // 차량 조회 또는 신규 등록
        Vehicle vehicle = vehicleRepository.findByPlateNumber(req.plateNumber())
                .orElseGet(() -> vehicleRepository.save(
                        Vehicle.builder()
                                .plateNumber(req.plateNumber())
                                .model(req.model())
                                .year(req.year() != null ? req.year().shortValue() : null)
                                .vin(req.vin())
                                .fuelType(req.fuelType() != null
                                        ? Vehicle.FuelType.valueOf(req.fuelType()) : null)
                                .build()
                ));

        // 차량 정보 업데이트 (OCR로 새 정보가 들어온 경우)
        if (req.model() != null)    vehicle.setModel(req.model());
        if (req.year()  != null)    vehicle.setYear(req.year().shortValue());
        if (req.vin()   != null)    vehicle.setVin(req.vin());

        // 주문 생성
        Order order = Order.builder()
                .vehicle(vehicle)
                .mechanic(mechanic)
                .mileage(req.mileage())
                .notes(req.notes())
                .build();

        // 항목 추가
        for (int i = 0; i < req.items().size(); i++) {
            var ir = req.items().get(i);
            int qty        = ir.quantity() != null ? ir.quantity() : 1;
            int totalPrice = ir.unitPrice() * qty;

            OrderItem item = OrderItem.builder()
                    .itemType(OrderItem.ItemType.valueOf(ir.itemType()))
                    .name(ir.name())
                    .quantity((short) qty)
                    .unitPrice(ir.unitPrice())
                    .totalPrice(totalPrice)
                    .oilBrand(ir.oilBrand())
                    .oilLiters(ir.oilLiters())
                    .sortOrder((short) i)
                    .build();
            order.addItem(item);
        }

        return OrderResponse.from(orderRepository.save(order));
    }

    /** 주문 상태 변경 (정비 완료 등) */
    @Transactional
    public OrderResponse updateStatus(Long orderId, String status, Integer mechanicId, String role) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("주문을 찾을 수 없습니다"));

        // 본인 주문이거나 admin만 상태 변경 가능
        if (!role.equals("admin") && !order.getMechanic().getId().equals(mechanicId)) {
            throw new AccessDeniedException("본인 담당 주문만 수정할 수 있습니다");
        }

        order.setStatus(Order.Status.valueOf(status));
        return OrderResponse.from(orderRepository.save(order));
    }

    /** 차량 정비 이력 조회 */
    @Transactional(readOnly = true)
    public List<OrderResponse> getVehicleHistory(String plateNumber) {
        Vehicle vehicle = vehicleRepository.findByPlateNumber(plateNumber)
                .orElse(null);
        if (vehicle == null) return List.of();

        return orderRepository.findByVehicleId(vehicle.getId())
                .stream().map(OrderResponse::from).toList();
    }
}
