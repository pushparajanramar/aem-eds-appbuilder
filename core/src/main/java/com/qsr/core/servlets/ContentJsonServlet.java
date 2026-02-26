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

import com.google.gson.JsonObject;

@Component(service = Servlet.class)
@SlingServletResourceTypes(
    resourceTypes = "qsr/components/page",
    selectors = "model",
    extensions = "json",
    methods = "GET"
)
public class ContentJsonServlet extends SlingSafeMethodsServlet {

    private static final long serialVersionUID = 1L;

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

        response.getWriter().write(json.toString());
    }
}
