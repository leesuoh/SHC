package com.shc.api.controller;

import com.shc.api.dto.ApiResponse;
import com.shc.api.dto.LoginRequest;
import com.shc.api.dto.LoginResponse;
import com.shc.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/login
     * Body: { "name": "사장님", "pin": "0000" }
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(ApiResponse.fail(e.getMessage()));
        }
    }

    /**
     * GET /api/health
     * 서버 상태 확인용
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.ok("SHC API is running"));
    }
}
