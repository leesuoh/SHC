package com.shc.api.repository;

import com.shc.api.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // 오늘의 정비 전체 (사장님용)
    @Query("SELECT o FROM Order o JOIN FETCH o.vehicle JOIN FETCH o.mechanic " +
           "WHERE o.createdAt >= :startOfDay ORDER BY o.createdAt DESC")
    List<Order> findTodayOrders(@Param("startOfDay") Instant startOfDay);

    // 오늘의 정비 — 특정 직원 (직원용)
    @Query("SELECT o FROM Order o JOIN FETCH o.vehicle JOIN FETCH o.mechanic " +
           "WHERE o.createdAt >= :startOfDay AND o.mechanic.id = :mechanicId ORDER BY o.createdAt DESC")
    List<Order> findTodayOrdersByMechanic(@Param("startOfDay") Instant startOfDay,
                                          @Param("mechanicId") Integer mechanicId);

    // 차량 정비 이력
    @Query("SELECT o FROM Order o JOIN FETCH o.mechanic " +
           "WHERE o.vehicle.id = :vehicleId ORDER BY o.createdAt DESC")
    List<Order> findByVehicleId(@Param("vehicleId") Integer vehicleId);

    // 진행 중인 주문 수
    long countByStatus(Order.Status status);
}
