package com.shc.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record OrderRequest(

        @NotBlank(message = "차량 번호를 입력하세요")
        String plateNumber,
        String model,
        Integer year,
        String vin,
        String fuelType,
        Integer mileage,
        String notes,

        @NotEmpty(message = "정비 항목을 1개 이상 입력하세요")
        List<ItemRequest> items
) {
    public record ItemRequest(
            @NotBlank String name,
            @NotNull  String itemType,   // ENGINE_OIL | PRESET | CUSTOM
            @NotNull  Integer unitPrice,
            Integer quantity,
            String oilBrand,
            BigDecimal oilLiters
    ) {}
}
