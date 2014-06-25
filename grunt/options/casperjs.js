module.exports = function(grunt) {

    var functional_tests_files = [
        '<%= paths.build %>/<%= paths.tests %>/functional/noCookiesTests.js',
        '<%= paths.build %>/<%= paths.tests %>/functional/refreshRedirectTests.js',
        '<%= paths.build %>/<%= paths.tests %>/functional/metricsTests.js',
        '<%= paths.build %>/<%= paths.tests %>/functional/setCookieTest.js',
    ];

    return {
        options: {
            async: {
                parallel: false
            },
        },

        // Functional tests are run directly on the built page
        functional: {
            src: functional_tests_files,
            options: {
                casperjsOptions: [
                    '--product=<%= grunt.task.current.args[0] %>',
                    '--xunit=<%= paths.test_results %>/functional/dev.xml',
                    '--env=dev',
                ]
            }
        },
        functionalstage: {
            src: functional_tests_files,
            options: {
                casperjsOptions: [
                    '--product=<%= grunt.task.current.args[0] %>',
                    '--HOST=<%= pkg.domains["stage"] %>',
                    '--env=stage',
                    '--fail-fast',
                    '--log-level=debug', //|info|warning|error]",
                    '--verbose',
                    '--xunit=<%= paths.test_results %>/functional/stage.xml',
                ]
            }
        },
        functionalcanary: {
            src: functional_tests_files,
            options: {
                casperjsOptions: [
                    '--product=<%= grunt.task.current.args[0] %>',
                    '--env=canary',
                    '--HOST=<%= pkg.domains["stage"] %>',
                    '--fail-fast',
                    '--xunit=<%= paths.test_results %>/functional/canary.xml',
                ]
            }
        },

        appstorelinks: {
            src: [ '<%= paths.build %>/<%= paths.tests %>/functional/appstoreLinkTests.js' ],
            options: {
                casperjsOptions: [
                    "--log-level=debug", //|info|warning|error]",
                    "--verbose",
                    '--env=dev',
                    '--product=<%= grunt.task.current.args[0] %>',
                    '--xunit=<%= paths.test_results %>/functional/appstorelinks.xml',
                    "--ignore-ssl-errors=true",
                    "--local-storage-path=./.localstorage",
                    "--local-to-remote-url-access=true",
                ]
            }
        },

        // Test product integration in production or stage
        integration: {
            src: [
                '<%= paths.build %>/<%= paths.tests %>/integration/productIntegrationTests.js'
            ],
            options: {
                force: true,
                casperjsOptions: [
                    "--log-level=debug", //|info|warning|error]",
                    "--verbose",
                    "--product=<%= grunt.task.current.args[1] %>",
                    "--env=<%= grunt.task.current.args[0] %>",
                    "--ignore-ssl-errors=true",
                    "--xunit=<%= paths.test_results %>/integration/<%= grunt.task.current.args[0] %>/productintegration_<%= grunt.task.current.args[1] %>.xml",
                    "--local-storage-path=./.localstorage",
                    "--local-to-remote-url-access=true",

                    // If you need to debug with charles, uncomment this line
                    // "--proxy=localhost:8888",
                ]
            }
        },
    };
};
