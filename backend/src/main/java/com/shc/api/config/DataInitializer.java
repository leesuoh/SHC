package com.shc.api.config;

import com.shc.api.entity.Mechanic;
import com.shc.api.repository.MechanicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Slf4j
@Configuration
@Profile("local")   // 로컬 개발 환경에서만 실행
@RequiredArgsConstructor
public class DataInitializer {

    private final MechanicRepository mechanicRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public ApplicationRunner initMechanics() {
        return args -> {
            if (mechanicRepository.count() > 0) {
                log.info("[DataInitializer] 직원 데이터가 이미 존재합니다. 초기화 건너뜀.");
                return;
            }

            // PIN: 사장님 0000, 부장님 1111, 이수오 2222, 막내 3333
            var mechanics = List.of(
                Mechanic.builder()
                    .name("사장님").role(Mechanic.Role.admin).grade(Mechanic.Grade.A)
                    .pinHash(passwordEncoder.encode("0000")).build(),
                Mechanic.builder()
                    .name("부장님").role(Mechanic.Role.mechanic).grade(Mechanic.Grade.A)
                    .pinHash(passwordEncoder.encode("1111")).build(),
                Mechanic.builder()
                    .name("이수오").role(Mechanic.Role.mechanic).grade(Mechanic.Grade.B)
                    .pinHash(passwordEncoder.encode("2222")).build(),
                Mechanic.builder()
                    .name("막내").role(Mechanic.Role.mechanic).grade(Mechanic.Grade.B)
                    .pinHash(passwordEncoder.encode("3333")).build()
            );

            mechanicRepository.saveAll(mechanics);
            log.info("[DataInitializer] 직원 4명 초기화 완료");
        };
    }
}
