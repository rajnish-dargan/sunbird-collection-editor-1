import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewEncapsulation} from '@angular/core';
import * as _ from 'lodash-es';
import { EditorTelemetryService } from '../../services/telemetry/telemetry.service';
import { EditorService } from '../../services/editor/editor.service';
@Component({
  selector: 'lib-qumlplayer-page',
  templateUrl: './qumlplayer-page.component.html',
  styleUrls: ['./qumlplayer-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class QumlplayerPageComponent implements OnChanges {
  qumlPlayerConfig: any;
  @Input() questionMetaData: any;
  @Input() questionSetHierarchy: any;
  @Output() public toolbarEmitter: EventEmitter<any> = new EventEmitter();
  prevQuestionId: string;
  questionIds: string[];
  showPlayerPreview = false;
  showPotrait = false;

  constructor(public telemetryService: EditorTelemetryService, public editorService: EditorService) { }

  ngOnChanges() {
    this.initQumlPlayer();
  }

  initQumlPlayer() {
    this.showPlayerPreview = false;
    this.questionMetaData = _.get(this.questionMetaData, 'data.metadata');
    const newQuestionId = _.get(this.questionMetaData, 'identifier');
    if (newQuestionId && this.prevQuestionId !== newQuestionId) {
      this.prevQuestionId = newQuestionId;
      this.questionIds = [newQuestionId];
      setTimeout(() => {
        this.showPlayerPreview = true;
      }, 0);
    }
  }

  switchToPotraitMode() {
    this.showPotrait = true;
  }
  switchToLandscapeMode() {
    this.showPotrait = false;
  }

  removeQuestion() {
    this.toolbarEmitter.emit({button: 'removeContent'});
  }

  editQuestion() {
    this.toolbarEmitter.emit({button : 'editContent'});
  }
}
