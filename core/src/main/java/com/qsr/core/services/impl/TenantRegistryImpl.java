package com.qsr.core.services.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.osgi.service.component.annotations.Component;

import com.qsr.core.services.TenantConfig;
import com.qsr.core.services.TenantRegistry;

/**
 * Singleton implementation of {@link TenantRegistry}.
 * <p>
 * Maintains a thread-safe map of registered tenants. The map is instance-scoped
 * (not static), so it is properly bound to the OSGi bundle lifecycle and cleaned
 * up on bundle restart.
 */
@Component(service = TenantRegistry.class, immediate = true)
public class TenantRegistryImpl implements TenantRegistry {

    private static final String DEFAULT_MARKET = "us";

    private final Map<String, TenantConfig> tenants = new ConcurrentHashMap<>();

    @Override
    public void register(TenantConfig config) {
        if (config != null && config.getMarket() != null) {
            tenants.put(config.getMarket(), config);
        }
    }

    @Override
    public void unregister(String market) {
        if (market != null) {
            tenants.remove(market);
        }
    }

    @Override
    public TenantConfig resolve(String resourcePath) {
        if (resourcePath == null) {
            return getDefault();
        }
        String market = extractMarket(resourcePath);
        TenantConfig config = tenants.get(market);
        return config != null ? config : getDefault();
    }

    @Override
    public TenantConfig getTenant(String market) {
        return tenants.get(market);
    }

    @Override
    public TenantConfig getDefault() {
        return tenants.get(DEFAULT_MARKET);
    }

    @Override
    public Collection<TenantConfig> getAllTenants() {
        return Collections.unmodifiableCollection(tenants.values());
    }

    @Override
    public boolean isAllowedEdsOrigin(String hostname) {
        for (TenantConfig tenant : tenants.values()) {
            String edsHost = tenant.getEdsHost();
            String registeredPrefix = extractHostPrefix(edsHost);
            String originPrefix = extractHostPrefix(hostname);
            if (registeredPrefix != null && registeredPrefix.equals(originPrefix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extracts the market code from a content path.
     * Path convention: /content/qsr/{market}/...
     */
    static String extractMarket(String path) {
        if (path == null) {
            return DEFAULT_MARKET;
        }
        String[] segments = path.split("/");
        if (segments.length >= 4 && "content".equals(segments[1]) && "qsr".equals(segments[2])) {
            return segments[3];
        }
        return DEFAULT_MARKET;
    }

    /**
     * Extracts the host prefix (branch--site--org) from an EDS hostname.
     * E.g. "main--qsr-us--org.aem.live" → "main--qsr-us--org"
     */
    private static String extractHostPrefix(String hostname) {
        if (hostname == null) {
            return null;
        }
        int dotIndex = hostname.indexOf('.');
        return dotIndex > 0 ? hostname.substring(0, dotIndex) : hostname;
    }
}
