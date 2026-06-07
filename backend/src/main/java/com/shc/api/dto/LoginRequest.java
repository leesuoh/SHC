package com.shc.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "이름을 입력하세요")
        String name,

        @NotBlank(message = "PIN을 입력하세요")
        @Size(min = 4, max = 4, message = "PIN은 4자리입니다")
        String pin
) {}
