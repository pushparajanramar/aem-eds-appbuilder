# ─── Fastly VCL — Device Detection & Vary Caching ──────────────────────────
#
# Implements Dynamic Serving device detection at the edge.
# Normalises the User-Agent into a compact X-Device-Type token so that
# the cache only needs to hold one response variant per device class rather
# than one per raw User-Agent string (which would destroy cache hit rates).
#
# Supported device classes:
#   mobile             – smartphones (portrait-primary)
#   tablet             – tablets (landscape / portrait)
#   desktop            – traditional browsers on laptops / desktops
#   kiosk              – touch kiosks (detected via query param or custom UA)
#   digital-menu-board – in-restaurant digital signage
#   headless           – API / JSON consumers (returns structured JSON, not HTML)
#
# Integration points:
#   1. vcl_recv  – sets req.http.X-Device-Type before cache lookup
#   2. vcl_fetch – appends X-Device-Type to the Vary header on cached objects
#
# URL override:  ?device=<type>  (useful for QA / preview)
# ─────────────────────────────────────────────────────────────────────────────

sub vcl_recv {
  #FASTLY recv

  # ── Step 1: Fastly built-in platform variables ──────────────────────────
  # client.platform.mobile  – true for smartphones
  # client.platform.tablet  – true for tablet-form-factor UAs
  # These are parsed from the User-Agent at sub-ms latency inside Fastly's
  # POP infrastructure and require no regex on the raw UA string.

  if (req.http.X-Device-Type) {
    # Honour an upstream-set header (e.g. from a shield or origin).
    # Validate to prevent header injection from untrusted callers.
    if (req.http.X-Device-Type !~ "^(mobile|tablet|desktop|kiosk|digital-menu-board|headless)$") {
      set req.http.X-Device-Type = "desktop";
    }
  } else if (req.url ~ "[?&]device=(mobile|tablet|desktop|kiosk|digital-menu-board|headless)(&|$)") {
    # ── Step 2: Query-parameter override (?device=…) ─────────────────────
    # Useful for QA, preview environments and forced layout testing.
    set req.http.X-Device-Type = re.group.1;

  } else if (req.http.User-Agent ~ "(?i)(SmartBoard|DigitalSignage|Mvix|BrightSign|ChromeOS.*kiosk)") {
    # ── Step 3: Digital-menu-board / kiosk UA patterns ───────────────────
    # Matches common digital signage and kiosk browser UA strings.
    set req.http.X-Device-Type = "digital-menu-board";

  } else if (req.http.User-Agent ~ "(?i)(kiosk|kios)") {
    set req.http.X-Device-Type = "kiosk";

  } else if (client.platform.tablet) {
    # ── Step 4: Fastly built-in tablet detection ─────────────────────────
    set req.http.X-Device-Type = "tablet";

  } else if (client.platform.mobile) {
    # ── Step 5: Fastly built-in mobile detection ─────────────────────────
    set req.http.X-Device-Type = "mobile";

  } else {
    # ── Step 6: Default to desktop ───────────────────────────────────────
    set req.http.X-Device-Type = "desktop";
  }

  return(pass);
}

sub vcl_fetch {
  #FASTLY fetch

  # ── Vary on the normalised device token, NOT on the raw User-Agent ──────
  # Varying on User-Agent would create thousands of cache variants.
  # Varying on X-Device-Type produces at most 5 variants (one per class),
  # which keeps the Cache Hit Ratio (CHR) high.

  if (beresp.http.Vary) {
    set beresp.http.Vary = beresp.http.Vary + ", X-Device-Type";
  } else {
    set beresp.http.Vary = "X-Device-Type";
  }

  return(deliver);
}

sub vcl_deliver {
  #FASTLY deliver

  # Echo the resolved device type back to the browser so client-side JS
  # can read it without performing its own UA sniffing.
  set resp.http.X-Device-Type = req.http.X-Device-Type;

  return(deliver);
}
