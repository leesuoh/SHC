package com.shc.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PaymentRequest(
        @NotNull  Long orderId,
        @NotBlank String paymentType,  // CASH | CARD | TRANSFER | CREDIT
        @NotNull @Positive Integer amount
) {}
