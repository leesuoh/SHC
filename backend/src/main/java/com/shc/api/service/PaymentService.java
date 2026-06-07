package com.shc.api.service;

import com.shc.api.dto.PaymentRequest;
import com.shc.api.entity.*;
import com.shc.api.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository  paymentRepository;
    private final OrderRepository    orderRepository;
    private final MechanicRepository mechanicRepository;

    /** 결제 등록 */
    @Transactional
    public Payment createPayment(PaymentRequest req, Integer mechanicId) {
        Order order = orderRepository.findById(req.orderId())
                .orElseThrow(() -> new EntityNotFoundException("주문을 찾을 수 없습니다"));

        Mechanic mechanic = mechanicRepository.findById(mechanicId)
                .orElseThrow(() -> new EntityNotFoundException("직원을 찾을 수 없습니다"));

        Payment.PaymentType type = Payment.PaymentType.valueOf(req.paymentType());
        Payment payment;

        if (type == Payment.PaymentType.CASH) {
            // 현금: PENDING 상태로 생성 → 사장님 승인 대기
            payment = Payment.cashPending(order, req.amount(), mechanic);
        } else {
            // 카드/이체/미수: 즉시 확정
            payment = Payment.instant(order, type, req.amount(), mechanic);
            order.setStatus(type == Payment.PaymentType.CREDIT
                    ? Order.Status.CREDIT : Order.Status.PAID);
            orderRepository.save(order);
        }

        return paymentRepository.save(payment);
    }

    /** 현금 결제 승인 (admin only) */
    @Transactional
    public Payment approveCash(Long paymentId, Integer adminId) {
        Mechanic admin = mechanicRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("직원을 찾을 수 없습니다"));
        if (!admin.isAdmin()) throw new AccessDeniedException("사장님만 승인할 수 있습니다");

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException("결제를 찾을 수 없습니다"));

        payment.approve(admin);
        payment.getOrder().setStatus(Order.Status.PAID);
        orderRepository.save(payment.getOrder());

        return paymentRepository.save(payment);
    }

    /** 현금 결제 반려 (admin only) */
    @Transactional
    public Payment rejectCash(Long paymentId, String reason, Integer adminId) {
        Mechanic admin = mechanicRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("직원을 찾을 수 없습니다"));
        if (!admin.isAdmin()) throw new AccessDeniedException("사장님만 반려할 수 있습니다");

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException("결제를 찾을 수 없습니다"));

        payment.reject(admin, reason);
        return paymentRepository.save(payment);
    }

    /** 승인 대기 현금 목록 (admin only) */
    @Transactional(readOnly = true)
    public List<Payment> getPendingCashPayments(Integer adminId) {
        Mechanic admin = mechanicRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("직원을 찾을 수 없습니다"));
        if (!admin.isAdmin()) throw new AccessDeniedException("사장님만 조회할 수 있습니다");

        return paymentRepository.findPendingCashPayments();
    }
}
