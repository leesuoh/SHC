package com.shc.api.dto;

public record LoginResponse(
        String token,
        MechanicDto mechanic
) {
    public record MechanicDto(
            Integer id,
            String name,
            String role,   // "admin" | "mechanic"
            String grade   // "A" | "B"
    ) {}
}
