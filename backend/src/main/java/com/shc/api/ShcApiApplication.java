package com.shc.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class ShcApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShcApiApplication.class, args);
    }
}
