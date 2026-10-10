package com.safesphere;

import com.safesphere.api.CitizenRoutes;
import com.safesphere.api.VolunteerSocketRoute;
import com.safesphere.fixture.AuthProvider;
import com.safesphere.fixture.DevelopmentFixtures;
import com.safesphere.fixture.FixtureAuthProvider;
import com.safesphere.fixture.FixtureTelemetryProvider;
import com.safesphere.fixture.TelemetryProvider;
import com.safesphere.incident.CapsuleIdGenerator;
import com.safesphere.incident.IncidentRegistry;
import com.safesphere.incident.IncidentService;
import com.safesphere.matching.CapabilityMatcher;
import com.safesphere.persistence.AuditEventRepository;
import com.safesphere.persistence.Database;
import com.safesphere.persistence.IncidentRepository;
import com.safesphere.persistence.ResponderRepository;
import com.safesphere.persistence.TelemetryFixtureRepository;
import com.safesphere.persistence.VictimProfileRepository;
import com.safesphere.security.EvidenceVault;
import com.safesphere.security.OtpService;
import com.safesphere.ws.VolunteerBroadcaster;
import io.javalin.Javalin;
import java.time.Clock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Composition root: builds the object graph and the HTTP/WebSocket surface, and owns the Javalin
 * lifecycle.
 *
 * <p>Everything is constructed here and injected, so tests can build the same graph against an
 * in-memory database and a fixed clock without starting a server.
 *
 * <p>The public surface is exactly the Citizen contract plus {@code GET /health}. No other route,
 * channel, or DTO is registered.
 */
public final class BackendApplication implements AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(BackendApplication.class);

    private final Database database;
    private final IncidentService incidents;
    private final VolunteerBroadcaster broadcaster;
    private final OtpService otpService;
    private final Javalin app;

    /**
     * Builds the graph and registers routes, without starting the server.
     *
     * @param database  the store to use; the caller owns it
     * @param vault     the evidence vault to use
     * @param clock     the clock to use
     * @param seedFixtures whether to load local development fixture data
     */
    public BackendApplication(Database database,
                              EvidenceVault vault,
                              Clock clock,
                              boolean seedFixtures) {
        this.database = database;
        database.migrate();

        IncidentRepository incidentRepository = new IncidentRepository(database);
        AuditEventRepository auditRepository = new AuditEventRepository(database);
        ResponderRepository responderRepository = new ResponderRepository(database);
        VictimProfileRepository profileRepository = new VictimProfileRepository(database);
        TelemetryFixtureRepository telemetryRepository = new TelemetryFixtureRepository(database);

        if (seedFixtures) {
            DevelopmentFixtures.seed(responderRepository, profileRepository, telemetryRepository);
        }

        TelemetryProvider telemetryProvider = new FixtureTelemetryProvider(telemetryRepository);
        AuthProvider authProvider = new FixtureAuthProvider(responderRepository);
        CapabilityMatcher matcher = new CapabilityMatcher(responderRepository);

        this.broadcaster = new VolunteerBroadcaster();
        this.incidents = new IncidentService(
                incidentRepository,
                auditRepository,
                responderRepository,
                profileRepository,
                telemetryProvider,
                authProvider,
                matcher,
                vault,
                broadcaster,
                new IncidentRegistry(incidentRepository),
                new CapsuleIdGenerator(incidentRepository),
                clock);

        // Internal only. There is no route that exposes an OTP: silencing is the Professional App's
        // Field mode action, and the Citizen contract has no OTP field.
        this.otpService = new OtpService();

        CitizenRoutes routes = new CitizenRoutes(incidents);
        this.app = Javalin.create(config -> {
            config.showJavalinBanner = false;
            config.http.defaultContentType = "application/json";
        });

        app.get("/health", routes::registerHealth);
        app.post("/api/v1/sos/trigger", routes::registerSosTrigger);
        app.post("/api/v1/volunteer/response", routes::registerVolunteerResponse);
        new VolunteerSocketRoute(broadcaster).register(app);

        app.exception(IllegalStateException.class, (e, ctx) -> {
            CitizenRoutes.logUnexpected("request", e);
            ctx.status(500);
            ctx.contentType("text/plain");
            ctx.result("internal error");
        });
        app.exception(Exception.class, (e, ctx) -> {
            CitizenRoutes.logUnexpected("request", e);
            ctx.status(500);
            ctx.contentType("text/plain");
            ctx.result("internal error");
        });
    }

    /** Starts listening. */
    public void start(int port) {
        app.start(port);
        log.info("SafeSphere backend listening on http://localhost:{} (Citizen contract v4)", port);
    }

    /** Stops listening. */
    public void stop() {
        app.stop();
    }

    /** The incident pipeline, exposed for tests and diagnostics. */
    public IncidentService incidents() {
        return incidents;
    }

    /** The volunteer push registry, exposed for tests and diagnostics. */
    public VolunteerBroadcaster broadcaster() {
        return broadcaster;
    }

    /** The internal OTP service. Not routed anywhere. */
    public OtpService otpService() {
        return otpService;
    }

    /** The underlying Javalin instance, for tests that need the port or to await startup. */
    public Javalin javalin() {
        return app;
    }

    /** The store in use. */
    public Database database() {
        return database;
    }

    @Override
    public void close() {
        stop();
    }
}
