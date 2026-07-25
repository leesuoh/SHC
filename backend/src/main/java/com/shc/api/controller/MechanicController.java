package com.shc.api.controller;

import com.shc.api.dto.ApiResponse;
import com.shc.api.repository.MechanicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 직원 목록 조회.
 *
 * 화면(로그인 · 담당 정비사 선택)이 하드코딩된 목록 대신 DB를 보게 하기 위한 것이다.
 * 목록을 두 곳에서 관리하면 id가 어긋나 담당자 지정이 조용히 실패한다.
 * 로그인 화면에서도 쓰므로 인증 없이 열어두되, PIN 해시는 절대 내보내지 않는다.
 */
@RestController
@RequestMapping("/api/mechanics")
@RequiredArgsConstructor
public class MechanicController {

    private final MechanicRepository mechanicRepository;

    public record MechanicDto(Integer id, String name, String role, String grade) {}

    @GetMapping
    public ResponseEntity<ApiResponse<List<MechanicDto>>> getAll() {
        List<MechanicDto> mechanics = mechanicRepository.findAll().stream()
                .map(m -> new MechanicDto(
                        m.getId(), m.getName(),
                        m.getRole().name(), m.getGrade().name()))
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(mechanics));
    }
}
