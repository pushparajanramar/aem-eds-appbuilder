package com.qsr.core.services;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/**
 * OSGi factory component that registers a tenant with the {@link TenantRegistry}.
 * <p>
 * Each factory instance represents one market tenant (US, UK, JP, …). On
 * activation it creates a {@link TenantConfig} and registers it with the
 * singleton {@link TenantRegistry}. On deactivation it removes the registration.
 * <p>
 * To add a new tenant, create an OSGi factory configuration:
 * {@code com.qsr.core.services.TenantResolverService~{market}.cfg.json}
 */
@Component(service = TenantResolverService.class, immediate = true)
@Designate(ocd = TenantResolverService.Config.class, factory = true)
public class TenantResolverService {

    @ObjectClassDefinition(
        name = "QSR Tenant Configuration",
        description = "Defines a market tenant with locale, currency, EDS host, and content root."
    )
    public @interface Config {

        @AttributeDefinition(name = "Market Code",
            description = "Unique market identifier, e.g. us, uk, jp")
        String market() default "us";

        @AttributeDefinition(name = "Locale",
            description = "BCP-47 locale, e.g. en-US, en-GB, ja-JP")
        String locale() default "en-US";

        @AttributeDefinition(name = "Currency",
            description = "ISO-4217 currency code, e.g. USD, GBP, JPY")
        String currency() default "USD";

        @AttributeDefinition(name = "Timezone",
            description = "IANA timezone, e.g. America/Los_Angeles")
        String timezone() default "America/Los_Angeles";

        @AttributeDefinition(name = "EDS Host",
            description = "Edge Delivery Services live host, e.g. main--qsr-us--org.aem.live")
        String edsHost() default "main--qsr-us--org.aem.live";

        @AttributeDefinition(name = "Content Root",
            description = "AEM content root path for this market, e.g. /content/qsr/us")
        String contentRoot() default "/content/qsr/us";
    }

    @Reference
    private TenantRegistry tenantRegistry;

    private String registeredMarket;

    @Activate
    @Modified
    protected void activate(Config config) {
        registeredMarket = config.market();
        TenantConfig tenant = new TenantConfig(
            config.market(),
            config.locale(),
            config.currency(),
            config.timezone(),
            config.edsHost(),
            config.contentRoot()
        );
        tenantRegistry.register(tenant);
    }

    @Deactivate
    protected void deactivate() {
        if (registeredMarket != null) {
            tenantRegistry.unregister(registeredMarket);
        }
    }
}
