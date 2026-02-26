package com.qsr.core.servlets;

import java.io.IOException;

import javax.servlet.Servlet;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;

import com.google.gson.JsonObject;
import com.qsr.core.services.TenantConfig;
import com.qsr.core.services.TenantResolverService;

@Component(service = Servlet.class)
@SlingServletResourceTypes(
    resourceTypes = "qsr/components/page",
    selectors = "model",
    extensions = "json",
    methods = "GET"
)
public class ContentJsonServlet extends SlingSafeMethodsServlet {

    private static final long serialVersionUID = 1L;

    @Reference(cardinality = ReferenceCardinality.OPTIONAL, policy = ReferencePolicy.DYNAMIC)
    private volatile TenantResolverService tenantResolver;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Resource resource = request.getResource();
        ValueMap properties = resource.adaptTo(ValueMap.class);

        JsonObject json = new JsonObject();
        if (properties != null) {
            for (String key : properties.keySet()) {
                Object value = properties.get(key);
                if (value instanceof String) {
                    json.addProperty(key, (String) value);
                } else if (value instanceof Number) {
                    json.addProperty(key, (Number) value);
                } else if (value instanceof Boolean) {
                    json.addProperty(key, (Boolean) value);
                } else if (value != null) {
                    json.addProperty(key, value.toString());
                }
            }
        }

        // Add tenant/market metadata resolved from the resource path
        TenantResolverService resolver = this.tenantResolver;
        if (resolver != null) {
            TenantConfig tenant = resolver.resolve(resource.getPath());
            if (tenant != null) {
                JsonObject tenantJson = new JsonObject();
                tenantJson.addProperty("market", tenant.getMarket());
                tenantJson.addProperty("locale", tenant.getLocale());
                tenantJson.addProperty("currency", tenant.getCurrency());
                tenantJson.addProperty("timezone", tenant.getTimezone());
                tenantJson.addProperty("edsHost", tenant.getEdsHost());
                tenantJson.addProperty("contentRoot", tenant.getContentRoot());
                json.add("tenant", tenantJson);
            }
        }

        response.getWriter().write(json.toString());
    }
}
