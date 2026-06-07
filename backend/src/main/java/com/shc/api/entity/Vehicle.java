package com.shc.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vehicles",
       uniqueConstraints = @UniqueConstraint(name = "uk_vehicles_plate", columnNames = "plate_number"))
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "plate_number", nullable = false, length = 20)
    private String plateNumber;   // "12가 3456"

    @Column(length = 100)
    private String model;         // "현대 아반떼 CN7"

    private Short year;           // 2021

    @Column(length = 17)
    private String vin;           // 차대번호

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", length = 10)
    private FuelType fuelType;

    // ── Enum ──
    public enum FuelType {
        gasoline, diesel, lpg, ev, hybrid
    }
}
