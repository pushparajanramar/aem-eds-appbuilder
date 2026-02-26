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

@Component(service = Filter.class)
@SlingServletFilter(scope = SlingServletFilterScope.REQUEST)
public class EDSCorsFilter implements Filter {

    private static final Pattern ALLOWED_ORIGIN_PATTERN = Pattern.compile(
        "^https://[a-zA-Z0-9-]+\\.(hlx\\.page|hlx\\.live|aem\\.page|aem\\.live)$"
    );

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
            if (origin != null && ALLOWED_ORIGIN_PATTERN.matcher(origin).matches()) {
                httpResponse.setHeader("Access-Control-Allow-Origin", origin);
                httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                httpResponse.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            }
        }

        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        // no cleanup needed
    }
}
