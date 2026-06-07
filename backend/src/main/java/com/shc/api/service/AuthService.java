package com.shc.api.service;

import com.shc.api.dto.LoginRequest;
import com.shc.api.dto.LoginResponse;
import com.shc.api.entity.Mechanic;
import com.shc.api.repository.MechanicRepository;
import com.shc.api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MechanicRepository mechanicRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        // 1. 직원 조회
        Mechanic mechanic = mechanicRepository.findByNameAndIsActiveTrue(request.name())
                .orElseThrow(() -> new BadCredentialsException("이름 또는 PIN이 맞지 않습니다"));

        // 2. PIN 검증 (BCrypt)
        if (!passwordEncoder.matches(request.pin(), mechanic.getPinHash())) {
            throw new BadCredentialsException("이름 또는 PIN이 맞지 않습니다");
        }

        // 3. JWT 발급
        String token = jwtUtil.generate(
                mechanic.getId(),
                mechanic.getName(),
                mechanic.getRole().name()
        );

        return new LoginResponse(
                token,
                new LoginResponse.MechanicDto(
                        mechanic.getId(),
                        mechanic.getName(),
                        mechanic.getRole().name(),
                        mechanic.getGrade().name()
                )
        );
    }
}
