package com.shc.api.security;

import com.shc.api.entity.Mechanic;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class MechanicUserDetails implements UserDetails {

    private final Mechanic mechanic;

    public MechanicUserDetails(Mechanic mechanic) {
        this.mechanic = mechanic;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // "ROLE_ADMIN" 또는 "ROLE_MECHANIC"
        return List.of(new SimpleGrantedAuthority("ROLE_" + mechanic.getRole().name().toUpperCase()));
    }

    @Override public String getPassword()  { return mechanic.getPinHash(); }
    @Override public String getUsername()  { return mechanic.getName(); }
    @Override public boolean isEnabled()   { return mechanic.getIsActive(); }
    @Override public boolean isAccountNonExpired()   { return true; }
    @Override public boolean isAccountNonLocked()    { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
}
