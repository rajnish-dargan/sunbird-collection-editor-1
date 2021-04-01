import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { merge, of, Subject } from 'rxjs';
import * as _ from 'lodash-es';
import { takeUntil, filter, switchMap, map } from 'rxjs/operators';
import { TreeService } from '../../services/tree/tree.service';
import { EditorService } from '../../services/editor/editor.service';
import { FrameworkService } from '../../services/framework/framework.service';
import { HelperService } from '../../services/helper/helper.service';
import { FormControl, FormGroup } from '@angular/forms';
import { ConfigService } from '../../services/config/config.service';
import * as moment from 'moment';
let framworkServiceTemp;

@Component({
  selector: 'lib-meta-form',
  templateUrl: './meta-form.component.html',
  styleUrls: ['./meta-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MetaFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() rootFormConfig: any;
  @Input() unitFormConfig: any;
  @Input() nodeMetadata: any;
  @Output() toolbarEmitter = new EventEmitter<any>();
  private onComponentDestroy$ = new Subject<any>();
  public frameworkDetails: any = {};
  public formFieldProperties: any;
  public additionalMetaData: any = {};
  public showAppIcon = false;
  public selectedNode: any;
  constructor(private editorService: EditorService, private treeService: TreeService,
              private frameworkService: FrameworkService, private helperService: HelperService,
              private configService: ConfigService) {
                framworkServiceTemp = frameworkService;
               }

  ngOnChanges() {
    this.fetchFrameWorkDetails();
    this.setAppIconVisibility();
  }

  ngOnInit() {
    this.setAppIconVisibility();
    if (this.showAppIcon && this.selectedNode.data ) {
      this.additionalMetaData.appIcon = _.get(this.selectedNode.data.metadata, 'appIcon');
    }
  }

  setAppIconVisibility() {
    this.selectedNode = this.treeService.getActiveNode();
    this.showAppIcon = this.selectedNode && this.selectedNode.data && this.selectedNode.data.root ? true : false;
  }

  fetchFrameWorkDetails() {
    if (this.frameworkService.organisationFramework) {
      this.frameworkService.frameworkData$.pipe(
        takeUntil(this.onComponentDestroy$),
        filter(data => _.get(data, `frameworkdata.${this.frameworkService.organisationFramework}`))
      ).subscribe((frameworkDetails: any) => {
        if (frameworkDetails && !frameworkDetails.err) {
          const frameworkData = frameworkDetails.frameworkdata[this.frameworkService.organisationFramework].categories;
          this.frameworkDetails.frameworkData = frameworkData;
          this.frameworkDetails.topicList = _.get(_.find(frameworkData, {
            code: 'topic'
          }), 'terms');
          this.frameworkDetails.targetFrameworks = _.filter(frameworkDetails.frameworkdata, (value, key) => {
            return _.includes(this.frameworkService.targetFrameworkIds, key);
          });
          this.attachDefaultValues();
        }
      });
    } else {
      if (this.frameworkService.targetFrameworkIds) {
        this.frameworkService.frameworkData$.pipe(
          takeUntil(this.onComponentDestroy$),
          filter(data => _.get(data, `frameworkdata.${this.frameworkService.targetFrameworkIds}`))
        ).subscribe((frameworkDetails: any) => {
          if (frameworkDetails && !frameworkDetails.err) {
            // const frameworkData = frameworkDetails.frameworkdata[this.frameworkService.targetFrameworkIds].categories;
            // this.frameworkDetails.frameworkData = frameworkData;
            // this.frameworkDetails.topicList = _.get(_.find(frameworkData, {
            //   code: 'topic'
            // }), 'terms');
            this.frameworkDetails.targetFrameworks = _.filter(frameworkDetails.frameworkdata, (value, key) => {
              return _.includes(this.frameworkService.targetFrameworkIds, key);
            });
            this.attachDefaultValues();
          }
        });
      }
    }
  }

  attachDefaultValues() {
    const metaDataFields = _.get(this.nodeMetadata, 'data.metadata');
    // if (_.isEmpty(metaDataFields)) { return; }
    const categoryMasterList = this.frameworkDetails.frameworkData;
    let formConfig: any = (metaDataFields.visibility === 'Default') ? _.cloneDeep(this.rootFormConfig) : _.cloneDeep(this.unitFormConfig);
    formConfig = formConfig && _.has(_.first(formConfig), 'fields') ? formConfig : [{name: '', fields: formConfig}];
    if (!_.isEmpty(this.frameworkDetails.targetFrameworks)) {
      _.forEach(this.frameworkDetails.targetFrameworks, (framework) => {
        _.forEach(formConfig, (section) => {
          _.forEach(section.fields, field => {
            const frameworkCategory = _.find(framework.categories, category => {
              return category.code === field.sourceCategory && _.includes(field.code, 'target');
            });
            if (!_.isEmpty(frameworkCategory)) { // field.code
              field.terms = frameworkCategory.terms;
            }
          });
        });
      });
    }

    _.forEach(formConfig, (section) => {
      _.forEach(section.fields, field => {

        if (metaDataFields) {
          if (_.has(metaDataFields, field.code)) {
            field.default = _.get(metaDataFields, field.code);
          } else if (_.includes(['maxTime', 'warningTime'], field.code)) {
            const value = _.get(metaDataFields, `timeLimits.${field.code}`);
            field.default = !_.isEmpty(value) ?
            moment.utc(moment.duration(value, 'seconds').asMilliseconds()).format(this.helperService.getTimerFormat(field)) : '';
          }
        }

        // const frameworkCategory = _.find(categoryMasterList, category => {
        //   return (category.code === field.sourceCategory || category.code === field.code) && !_.includes(field.code, 'target');
        // // });
        // if (!_.isEmpty(frameworkCategory)) {
        //   field.terms = frameworkCategory.terms;
        // }

        if (field.code === 'framework') {
          field.range = this.frameworkService.frameworkValues;
          field.options = this.getFramework;
        }

        if (!_.includes(field.depends, 'framework')) {
          const frameworkCategory = _.find(categoryMasterList, category => {
              return (category.code === field.sourceCategory || category.code === field.code);
          });
          if (!_.isEmpty(frameworkCategory)) {
              field.terms = frameworkCategory.terms;
          }
        }

        if (field.code === 'license' && this.helperService.getAvailableLicenses()) {
          const licenses = this.helperService.getAvailableLicenses();
          if (licenses && licenses.length) {
            field.range = _.isArray(licenses) ? _.map(licenses, 'name') : [licenses];
          }
        }

        if (field.code === 'additionalCategories') {
          const channelInfo = this.helperService.channelInfo;
          const additionalCategories = _.uniq(_.get(channelInfo,
            `${this.configService.categoryConfig.additionalCategories[this.editorService.editorConfig.config.objectType]}`) ||
           _.get(this.editorService.editorConfig, 'context.additionalCategories'));
          if (!_.isEmpty(additionalCategories)) {
            field.range = _.uniq(additionalCategories);
          }
        }

        if (field.code  === 'copyright') {
          const channelData = this.helperService.channelInfo;
          field.default = _.get(metaDataFields, field.code) || (channelData && channelData.name);
        }

        if (field.code === 'maxQuestions') {
          const rootFirstChildNode = this.treeService.getFirstChild();
          if (rootFirstChildNode && rootFirstChildNode.children) {
            field.range = _.times(_.size(rootFirstChildNode.children), index => index + 1);
          }
        }

        if (field.code === 'showTimer') {
          field.options = this.showTimer;
        }

        if ((_.isEmpty(field.range) || _.isEmpty(field.terms)) &&
          !field.editable && !_.isEmpty(field.default)) {
          if (_.has(field, 'terms')) {
            field.terms = [];
            if (_.isArray(field.default)) {
              field.terms = field.default;
            } else {
              field.terms.push(field.default);
            }
          } else {
            field.range = [];
            if (_.isArray(field.default)) {
              field.range = field.default;
            } else {
              field.range.push(field.default);
            }
          }
        }

        if (field.inputType === 'nestedselect') {
          _.map(field.range, val => {
            return {
              value: val.value || val,
              label: val.value || val
            };
          });
        }

        if (_.includes(['review', 'read', 'sourcingreview' ], this.editorService.editorMode)) {
          _.set(field, 'editable', false);
        }

      });
    });

    this.formFieldProperties = _.cloneDeep(formConfig);
    console.log(this.formFieldProperties);
  }

  outputData(eventData: any) { }

  onStatusChanges(event) {
    this.toolbarEmitter.emit({ button: 'onFormStatusChange', event });
  }

  valueChanges(event: any) {
    console.log(event);
    if (!_.isEmpty(this.additionalMetaData) && this.showAppIcon) {
      event = _.merge(this.additionalMetaData, event);
    }
    this.toolbarEmitter.emit({ button: 'onFormValueChange', event });
    this.treeService.updateNode(event);
  }

  additionalMetaDataHandler(event) {
    if (event.type  === 'image') {
      this.additionalMetaData = {
        appIcon: event.url
      };
    }
    this.treeService.updateAppIcon(event.url);
  }


  showTimer(control, depends: FormControl[], formGroup: FormGroup, loading, loaded) {
    const oldValue = {};
    const response = merge(..._.map(depends, depend => depend.valueChanges)).pipe(
      switchMap((value: any) => {
        const isDependsInvalid = _.includes(_.map(depends, depend => depend.invalid), true);
        if (!isDependsInvalid) {
          return of(true);
        } else {
          return of(false);
        }
      })
    );
    return response;
  }

  getFramework(control, depends: FormControl[], formGroup: FormGroup, loading, loaded) {
    const response =  control.valueChanges.pipe(
      switchMap((value: any) => {
        if (!_.isEmpty(value)) {
          return framworkServiceTemp.getFrameworkCategories(value).pipe(map(res => {
            return _.get(res, 'result');
          }));
        } else {
          return of(null);
        }
      })
    );
    return response;
  }

  ngOnDestroy() {
    this.onComponentDestroy$.next();
    this.onComponentDestroy$.complete();
  }
}
