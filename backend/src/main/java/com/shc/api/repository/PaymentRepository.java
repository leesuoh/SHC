package com.shc.api.repository;

import com.shc.api.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // 사장님 승인 대기 중인 현금 결제 목록
    @Query("SELECT p FROM Payment p JOIN FETCH p.order o JOIN FETCH o.vehicle JOIN FETCH p.requestedBy " +
           "WHERE p.status = 'PENDING' AND p.paymentType = 'CASH' ORDER BY p.requestedAt ASC")
    List<Payment> findPendingCashPayments();

    List<Payment> findByOrderId(Long orderId);
}
