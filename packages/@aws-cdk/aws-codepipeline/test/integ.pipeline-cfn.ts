import cfn = require('@aws-cdk/aws-cloudformation');
import { Role } from '@aws-cdk/aws-iam';
import { ServicePrincipal } from '@aws-cdk/aws-iam';
import s3 = require('@aws-cdk/aws-s3');
import cdk = require('@aws-cdk/cdk');
import codepipeline = require('../lib');

const app = new cdk.App();

const stack = new cdk.Stack(app, 'aws-cdk-codepipeline-cloudformation');

const pipeline = new codepipeline.Pipeline(stack, 'Pipeline');

const sourceStage = new codepipeline.Stage(pipeline, 'Source', { pipeline });
const bucket = new s3.Bucket(stack, 'PipelineBucket', {
  versioned: true,
});
const source = new s3.PipelineSourceAction(stack, 'Source', {
  stage: sourceStage,
  outputArtifactName: 'SourceArtifact',
  bucket,
  bucketKey: 'key',
});

const cfnStage = new codepipeline.Stage(stack, 'CFN', { pipeline });

const changeSetName = "ChangeSetIntegTest";
const stackName = "IntegTest-TestActionStack";

const role = new Role(stack, 'CfnChangeSetRole', {
  assumedBy: new ServicePrincipal('cloudformation.amazonaws.com'),
});

new cfn.PipelineCreateReplaceChangeSetAction(stack, 'DeployCFN', {
  stage: cfnStage,
  changeSetName,
  stackName,
  role,
  templatePath: source.outputArtifact.atPath('test.yaml'),
});

app.run();
