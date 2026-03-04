package com.qsr.core.filters;

import java.io.IOException;
import java.util.regex.Pattern;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.sling.servlets.annotations.SlingServletFilter;
import org.apache.sling.servlets.annotations.SlingServletFilterScope;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;

import com.qsr.core.services.TenantRegistry;

@Component(service = Filter.class)
@SlingServletFilter(scope = SlingServletFilterScope.REQUEST)
public class EDSCorsFilter implements Filter {

    /** Matches any EDS preview/live domain. */
    private static final Pattern EDS_DOMAIN_PATTERN = Pattern.compile(
        "^https://[a-zA-Z0-9-]+\\.(hlx\\.page|hlx\\.live|aem\\.page|aem\\.live)$"
    );

    @Reference(cardinality = ReferenceCardinality.OPTIONAL, policy = ReferencePolicy.DYNAMIC)
    private volatile TenantRegistry tenantRegistry;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // no initialization needed
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest && response instanceof HttpServletResponse) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            HttpServletResponse httpResponse = (HttpServletResponse) response;

            String origin = httpRequest.getHeader("Origin");
            if (origin != null && isAllowedOrigin(origin)) {
                httpResponse.setHeader("Access-Control-Allow-Origin", origin);
                httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                httpResponse.setHeader("Access-Control-Allow-Headers",
                    "Content-Type, Authorization, X-Requested-With");
                httpResponse.setHeader("Access-Control-Allow-Credentials", "true");

                if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
                    httpResponse.setStatus(HttpServletResponse.SC_OK);
                    return;
                }
            }
        }

        chain.doFilter(request, response);
    }

    /**
     * Validates the origin against both the generic EDS domain pattern and
     * per-tenant EDS host registrations.
     * <p>
     * In a multitenant setup the {@link TenantRegistry} holds all
     * registered tenant EDS hosts. If available, origins are additionally
     * checked against those hosts so that only origins belonging to a
     * registered tenant are accepted.
     */
    private boolean isAllowedOrigin(String origin) {
        if (!EDS_DOMAIN_PATTERN.matcher(origin).matches()) {
            return false;
        }
        // If tenant registry is available, further validate against registered tenants
        TenantRegistry registry = this.tenantRegistry;
        if (registry != null && !registry.getAllTenants().isEmpty()) {
            try {
                String hostname = origin.replaceFirst("^https://", "");
                return registry.isAllowedEdsOrigin(hostname);
            } catch (Exception e) {
                // Deny access if tenant resolution fails — fail closed
                return false;
            }
        }
        // No tenant resolver available — fall back to generic pattern
        return true;
    }

    @Override
    public void destroy() {
        // no cleanup needed
    }
}
