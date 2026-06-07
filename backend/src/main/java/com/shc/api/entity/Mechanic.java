package com.shc.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mechanics")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mechanic extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 20)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 1)
    private Grade grade;

    @Column(name = "pin_hash", nullable = false)
    private String pinHash;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // ── Enums ──
    public enum Role {
        admin, mechanic
    }

    public enum Grade {
        A, B
    }

    // 편의 메서드
    public boolean isAdmin() {
        return this.role == Role.admin;
    }
}
