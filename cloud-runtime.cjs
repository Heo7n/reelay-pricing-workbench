'use strict';
const {createClient} = require('@supabase/supabase-js');
const {createCloudClient} = require('./cloud-client.cjs');
window.ReelayCloud = createCloudClient(REELAY_CLOUD_CONFIG, {createClient});
