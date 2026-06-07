package com.shc.api.security;

import com.shc.api.repository.MechanicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MechanicUserDetailsService implements UserDetailsService {

    private final MechanicRepository mechanicRepository;

    @Override
    public UserDetails loadUserByUsername(String name) throws UsernameNotFoundException {
        return mechanicRepository.findByNameAndIsActiveTrue(name)
                .map(MechanicUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("직원을 찾을 수 없습니다: " + name));
    }
}
