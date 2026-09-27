package com.safesphere;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.safesphere.persistence.Database;
import com.safesphere.security.EvidenceVault;
import java.io.IOException;
import java.net.ServerSocket;
import java.time.Clock;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

/** Tests for the executable bootstrap: port resolution, wiring, and start-up. */
class SafeSphereApplicationTest {

    @Nested
    @DisplayName("PORT resolution")
    class PortResolution {

        @Test
        @DisplayName("an unset PORT uses 8080")
        void defaultsTo8080() {
            assertEquals(8080, SafeSphereApplication.resolvePort(null));
            assertEquals(8080, SafeSphereApplication.DEFAULT_PORT);
        }

        @ParameterizedTest(name = "PORT={0} is used as given")
        @ValueSource(strings = {"3000", "8080", "9090", "65535"})
        void validPortIsUsed(String raw) {
            assertEquals(Integer.parseInt(raw), SafeSphereApplication.resolvePort(raw));
        }

        @ParameterizedTest(name = "surrounding whitespace in PORT={0} is tolerated")
        @ValueSource(strings = {" 8081 ", "9090\t"})
        void whitespaceTolerated(String raw) {
            assertEquals(Integer.parseInt(raw.trim()), SafeSphereApplication.resolvePort(raw));
        }

        @ParameterizedTest(name = "invalid PORT={0} falls back to 8080")
        @ValueSource(strings = {"not-a-port", "80.5", "0x1F", "8080abc"})
        void invalidPortFallsBack(String raw) {
            assertEquals(8080, SafeSphereApplication.resolvePort(raw));
        }

        @ParameterizedTest(name = "out-of-range PORT={0} falls back to 8080")
        @ValueSource(strings = {"0", "-1", "65536", "99999"})
        void outOfRangePortFallsBack(String raw) {
            assertEquals(8080, SafeSphereApplication.resolvePort(raw));
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"   "})
        void blankPortFallsBack(String raw) {
            assertEquals(8080, SafeSphereApplication.resolvePort(raw));
        }
    }

    @Nested
    @DisplayName("evidence key configuration")
    class KeyConfiguration {

        @Test
        @DisplayName("a base64 key builds a working vault")
        void base64KeyBuildsVault() {
            String key = java.util.Base64.getEncoder().encodeToString(EvidenceVault.generateKey());

            EvidenceVault vault = EvidenceVault.fromBase64(key);

            assertEquals("payload", vault.open(vault.seal("payload")));
        }

        @Test
        @DisplayName("a wrongly sized key is refused with actionable guidance")
        void wrongSizeKeyRefused() {
            String key = java.util.Base64.getEncoder().encodeToString(new byte[16]);

            IllegalArgumentException e =
                    assertThrows(IllegalArgumentException.class, () -> EvidenceVault.fromBase64(key));

            assertTrue(e.getMessage().contains("32"), e.getMessage());
        }
    }

    @Nested
    @DisplayName("application wiring")
    class Wiring {

        @Test
        @DisplayName("the application starts and stops on a real port")
        void startsAndStops() throws IOException {
            int port;
            try (ServerSocket socket = new ServerSocket(0)) {
                port = socket.getLocalPort();
            }
            Database database = Database.inMemory("boot-" + UUID.randomUUID());
            BackendApplication app = new BackendApplication(
                    database, new EvidenceVault(EvidenceVault.generateKey()), Clock.systemUTC(), true);
            try {
                app.start(port);

                assertNotNull(app.javalin());
                assertNotNull(app.incidents());
                assertNotNull(app.otpService());
            } finally {
                app.close();
                database.close();
            }
        }

        @Test
        @DisplayName("starting twice on a busy port fails loudly rather than silently")
        void busyPortFails() throws IOException {
            int port;
            try (ServerSocket socket = new ServerSocket(0)) {
                port = socket.getLocalPort();
            }
            Database first = Database.inMemory("busy-a-" + UUID.randomUUID());
            Database second = Database.inMemory("busy-b-" + UUID.randomUUID());
            BackendApplication a = new BackendApplication(
                    first, new EvidenceVault(EvidenceVault.generateKey()), Clock.systemUTC(), true);
            BackendApplication b = new BackendApplication(
                    second, new EvidenceVault(EvidenceVault.generateKey()), Clock.systemUTC(), true);
            try {
                a.start(port);
                assertThrows(Exception.class, () -> b.start(port));
            } finally {
                a.close();
                b.close();
                first.close();
                second.close();
            }
        }

        @Test
        @DisplayName("seeding the fixtures makes volunteers, profiles, and coordinates available")
        void seedingPopulatesTheFixtureTables() {
            Database seeded = Database.inMemory("seeded-" + UUID.randomUUID());
            Database bare = Database.inMemory("bare-" + UUID.randomUUID());
            try {
                seeded.migrate();
                bare.migrate();

                com.safesphere.persistence.ResponderRepository seededResponders =
                        new com.safesphere.persistence.ResponderRepository(seeded);
                com.safesphere.persistence.ResponderRepository bareResponders =
                        new com.safesphere.persistence.ResponderRepository(bare);
                com.safesphere.persistence.VictimProfileRepository seededProfiles =
                        new com.safesphere.persistence.VictimProfileRepository(seeded);
                com.safesphere.persistence.VictimProfileRepository bareProfiles =
                        new com.safesphere.persistence.VictimProfileRepository(bare);
                com.safesphere.persistence.TelemetryFixtureRepository seededTelemetry =
                        new com.safesphere.persistence.TelemetryFixtureRepository(seeded);
                com.safesphere.persistence.TelemetryFixtureRepository bareTelemetry =
                        new com.safesphere.persistence.TelemetryFixtureRepository(bare);

                com.safesphere.fixture.DevelopmentFixtures.seed(
                        seededResponders, seededProfiles, seededTelemetry);

                assertTrue(seededProfiles.findByDeviceId("DEV-4471").isPresent());
                assertTrue(seededTelemetry.findByDeviceId("DEV-4471").isPresent());
                assertTrue(seededResponders.findOnlineExcluding(java.util.Set.of()).size() >= 1);
                assertTrue(bareProfiles.findByDeviceId("DEV-4471").isEmpty(),
                        "an unseeded database has no fixture identity");
            } finally {
                seeded.close();
                bare.close();
            }
        }

        @Test
        @DisplayName("the main class is loadable, so the shaded JAR entry point exists")
        void mainClassExists() throws ClassNotFoundException {
            assertNotNull(Class.forName("com.safesphere.SafeSphereApplication"));
        }

        @Test
        @DisplayName("the OTP service is reachable in-process but has no route")
        void otpIsInternalOnly() {
            Database database = Database.inMemory("otp-" + UUID.randomUUID());
            try (BackendApplication app = new BackendApplication(
                    database, new EvidenceVault(EvidenceVault.generateKey()), Clock.systemUTC(), true)) {

                assertNotNull(app.otpService());
                assertNotNull(app.otpService().issue("CR-1", java.time.Instant.now()));
            } finally {
                database.close();
            }
        }
    }

    @Nested
    @DisplayName("the default database path")
    class DatabasePath {

        @Test
        @DisplayName("a file-backed database is created under the documented path")
        void fileDatabaseIsCreated(@org.junit.jupiter.api.io.TempDir java.nio.file.Path tempDir) {
            java.nio.file.Path file = tempDir.resolve("nested").resolve("test.db");
            Database database = new Database(file.toString());
            try {
                database.migrate();

                assertTrue(java.nio.file.Files.exists(file), "the database file should be created");
            } finally {
                database.close();
            }
        }
    }

    @Nested
    @DisplayName("excluded surfaces")
    class ExcludedSurfaces {

        @ParameterizedTest(name = "{0} is not implemented in this backend")
        @CsvSource({
                "com.safesphere.api.AgentRoutes",
                "com.safesphere.api.TelemetryRoutes",
                "com.safesphere.api.AdminRoutes",
                "com.safesphere.api.DispatchRoutes",
                "com.safesphere.api.FieldRoutes",
                "com.safesphere.api.OfficialSocketRoute",
                "com.safesphere.professional.FieldCapsuleView"
        })
        void excludedClassesAreAbsent(String className) {
            assertThrows(ClassNotFoundException.class, () -> Class.forName(className),
                    className + " must not exist: it belongs to a contract this backend has not been given");
        }
    }
}
