import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AssetBrowserComponent } from './asset-browser.component';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {mockData} from './asset-browser.component.spec.data';

describe('AssetBrowserComponent', () => {
  let component: AssetBrowserComponent;
  let fixture: ComponentFixture<AssetBrowserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ InfiniteScrollModule, HttpClientTestingModule ],
      declarations: [ AssetBrowserComponent ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#ngOnInit() should call #getAcceptType()', () => {
    component.assetConfig.image.accepted = 'dummyData';
    spyOn(component, 'ngOnInit').and.callThrough();
    spyOn(component, 'getAcceptType').and.callThrough();
    component.ngOnInit();
    expect(component.getAcceptType).toHaveBeenCalledWith('dummyData', 'image');
  });

  it('#initializeImagePicker() should set showImagePicker to true', () => {
    spyOn(component, 'initializeImagePicker').and.callThrough();
    component.initializeImagePicker();
    expect(component.showImagePicker).toBeTruthy();
  });

  it('#addImageInEditor() should set showImagePicker to false', () => {
    spyOn(component, 'addImageInEditor').and.callThrough();
    component.addImageInEditor(mockData.assetBrowserEvent.url, '12345');
    expect(component.showImagePicker).toBeFalsy();
  });

  it('#addImageInEditor() should set appIcon value', () => {
    spyOn(component, 'addImageInEditor').and.callThrough();
    component.addImageInEditor(mockData.assetBrowserEvent.url, '12345');
    expect(component.appIcon).toBe(mockData.assetBrowserEvent.url);
  });

  it('#addImageInEditor() should emit proper event', () => {
    spyOn(component, 'addImageInEditor').and.callThrough();
    spyOn(component.assetBrowserEmitter, 'emit').and.returnValue(mockData.assetBrowserEvent);
    component.addImageInEditor(mockData.assetBrowserEvent.url, '12345');
    expect(component.assetBrowserEmitter.emit).toHaveBeenCalledWith(mockData.assetBrowserEvent);
  });

  it('#dismissImageUploadModal() should set showImagePicker to true', () => {
    spyOn(component, 'dismissImageUploadModal').and.callThrough();
    component.dismissImageUploadModal();
    expect(component.showImagePicker).toBeTruthy();
  });

  it('#dismissImageUploadModal() should set showImageUploadModal to false', () => {
    spyOn(component, 'dismissImageUploadModal').and.callThrough();
    component.dismissImageUploadModal();
    expect(component.showImageUploadModal).toBeFalsy();
  });
});
