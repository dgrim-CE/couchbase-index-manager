import program from 'commander';
import {extend} from 'lodash';
import pkg from './../package.json';
import chalk from 'chalk';
import {Sync} from './sync';

/**
 * Parses options from the parent command, such as cluster, username,
 * and password and returns a simple map.
 *
 * @param  {{parent: object}} cmd
 * @return {{cluster: ?string, username: ?string, password: ?string}}
 */
function parseBaseOptions(cmd) {
    return {
        cluster: cmd.parent.cluster,
        username: cmd.parent.username,
        password: cmd.parent.password,
    };
}

/**
 * Handles a promise by printing any exception to the console.
 *
 * @param  {Promise} promise
 */
function handleAsync(promise) {
    promise.catch((err) => {
        console.error(chalk.redBright(err));

        process.exit(1);
    });
}

program
    .version(pkg.version)
    .description('Command-line utility for managing couchbase indexes')
    .option(
        '-c, --cluster <cluster>',
        'Couchcbase cluster (i.e. couchbase://...)',
        'couchbase://localhost')
    .option(
        '-u, --username <username>',
        'Couchbase administrator username',
        'Administrator')
    .option(
        '-p, --password <password>',
        'Couchbase administrator password')
    .option(
        '--no-color',
        'Supress color in output'); // Applied automatically by chalk

program
    .command('sync <bucket> <path>')
    .description('Synchronize indexes with index definition files')
    .option(
        '-t, --build-timeout',
        'Seconds to wait for indexes to complete building (default 5m)',
        /^\d+$/,
        300)
    .option(
        '-f, --force',
        'Bypass confirmation prompt')
    .option(
        '--dry-run',
        'Output planned changes without committing them')
    .option(
        '--safe',
        'Prevents dropping indexes')
    .action((bucketName, path, cmd) => {
        let connectionInfo = extend(
            parseBaseOptions(cmd),
            {
                bucketName,
            });

        let options = {
            interactive: true,
            confirmationPrompt: !cmd.force,
            dryRun: cmd.dryRun,
            safe: cmd.safe,
            buildTimeout: cmd.buildTimeout * 1000,
        };

        let sync = new Sync(connectionInfo, path, options);

        handleAsync(sync.execute());
    })
    .on('--help', () => {
        console.log();
        console.log('  Examples:');
        console.log();
        console.log('    $ couchbase-index-manager -c couchbase://localhost -u Administrator -p password sync beer-sample ./directory/');
        console.log('    $ couchbase-index-manager -c couchbase://localhost -u Administrator -p password sync beer-sample ./directory/file.yaml');
        console.log('    $ couchbase-index-manager -c couchbase://localhost -u Administrator -p password sync beer-sample ./directory/file.json');
    });

program.parse(process.argv);